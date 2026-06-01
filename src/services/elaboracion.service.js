const { Elaboracion, DetalleElaboracion } = require('../models/Elaboracion')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')

const getAll = async () => {
  const elaboraciones = await Elaboracion.findAll({
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
      obs:           e.obs || '',
      ingredientesConsumidos,
      productoGenerado: {
        nombre:   producto?.nombre || '',
        cantidad: e.cantidad,
        unidad:   producto?.unidad || 'u'
      }
    }
  }))
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { ingredientesConsumidos, ...elaboracionData } = data
    const elaboracion = await Elaboracion.create(elaboracionData, { transaction: t })
    if (ingredientesConsumidos?.length > 0) {
      await DetalleElaboracion.bulkCreate(
        ingredientesConsumidos.map(i => ({
          idElaboracion:  elaboracion.idElaboracion,
          idIngrediente:  i.idIngrediente,
          cant:           i.cant,
          precioUnitario: i.precioUnitario || 0
        })),
        { transaction: t }
      )
      for (const i of ingredientesConsumidos) {
        await Ingrediente.decrement('stock', { by: i.cant, where: { idIngrediente: i.idIngrediente }, transaction: t })
      }
    }
    if (elaboracionData.idProducto) {
      await Producto.increment('stock', { by: elaboracionData.cantidad, where: { idProducto: elaboracionData.idProducto }, transaction: t })
    }
    await t.commit()
    return { mensaje: 'Elaboración registrada', idElaboracion: elaboracion.idElaboracion }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

module.exports = { getAll, create }
