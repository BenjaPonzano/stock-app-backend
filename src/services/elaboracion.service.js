const { Elaboracion, DetalleElaboracion } = require('../models/Elaboracion')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const { Receta, DetalleReceta } = require('../models/Receta')
const { convertir, redondear } = require('../utils/unidades')
const sequelize = require('../db')

const getAll = async (idSucursal) => {
  const where = idSucursal ? { idSucursal } : {}
  const elaboraciones = await Elaboracion.findAll({
    where,
    include: [{ model: DetalleElaboracion, as: 'ingredientes' }],
    order: [['fecha', 'DESC']]
  })
  return Promise.all(elaboraciones.map(async e => {
    const producto = await Producto.findByPk(e.idProducto)
    const ingredientesConsumidos = await Promise.all(
      (e.ingredientes || []).map(async d => {
        const ing = await Ingrediente.findByPk(d.idIngrediente)
        return { nombre: ing?.nombre || '', cant: d.cant, unidad: ing?.unidad || '' }
      })
    )
    return {
      id:            'E-' + String(e.idElaboracion).padStart(4, '0'),
      idElaboracion: e.idElaboracion,
      recetaId:      e.idReceta,
      recetaNombre:  e.recetaNombre,
      fecha:         e.fecha,
      sucursal:      e.idSucursal,
      cantidad:      e.cantidad,
      unidades:      e.unidades ?? e.cantidad,
      obs:           e.obs || '',
      ingredientesConsumidos,
      productoGenerado: {
        nombre:   producto?.nombre || '',
        // Las elaboraciones viejas no guardaban las unidades: sumaron solo la cantidad de lotes.
        cantidad: e.unidades ?? e.cantidad,
        unidad:   producto?.unidad || 'u'
      }
    }
  }))
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { ingredientesConsumidos, unidades: _ignorado, ...elaboracionData } = data
    // Cada lote rinde "cantPorLote" unidades de la receta: eso es lo que entra al stock.
    const receta = elaboracionData.idReceta ? await Receta.findByPk(elaboracionData.idReceta, { transaction: t }) : null
    const unidades = elaboracionData.cantidad * (receta?.cantPorLote || 1)
    const elaboracion = await Elaboracion.create({ ...elaboracionData, unidades }, { transaction: t })

    // Consumo de ingredientes: si hay receta, se calcula acá (lotes x cantidad de la receta, pasada
    // a la unidad en que el ingrediente lleva su stock: 300 g de una harina en kg = 0,3 kg).
    // Sin receta se usa lo que mande el cliente, que ya debe venir en la unidad del stock.
    let consumos = ingredientesConsumidos || []
    if (receta) {
      const detalles = await DetalleReceta.findAll({ where: { idReceta: receta.idReceta }, transaction: t })
      if (detalles.length > 0) {
        consumos = []
        for (const d of detalles) {
          const ing = await Ingrediente.findByPk(d.idIngrediente, { transaction: t })
          if (!ing) continue
          const enReceta = d.cant * elaboracionData.cantidad
          consumos.push({
            idIngrediente: d.idIngrediente,
            cant: redondear(convertir(enReceta, d.unidad || ing.unidad, ing.unidad))
          })
        }
      }
    }

    if (consumos.length > 0) {
      await DetalleElaboracion.bulkCreate(
        consumos.map(i => ({
          idElaboracion:  elaboracion.idElaboracion,
          idIngrediente:  i.idIngrediente,
          cant:           i.cant,
          precioUnitario: i.precioUnitario || 0
        })),
        { transaction: t }
      )
      for (const i of consumos) {
        // ROUND evita arrastrar errores de coma flotante en el stock (9.700000000000001)
        await Ingrediente.update(
          { stock: sequelize.literal(`ROUND(stock - ${Number(i.cant)}, 3)`) },
          { where: { idIngrediente: i.idIngrediente }, transaction: t }
        )
      }
    }
    if (elaboracionData.idProducto) {
      await Producto.increment('stock', { by: unidades, where: { idProducto: elaboracionData.idProducto }, transaction: t })
    }
    await t.commit()
    return { mensaje: 'Elaboración registrada', idElaboracion: elaboracion.idElaboracion, unidades }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

module.exports = { getAll, create }
