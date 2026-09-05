const { Receta, DetalleReceta } = require('../models/Receta')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const Sucursal = require('../models/Sucursal')
const sequelize = require('../db')
const { Op } = require('sequelize')

DetalleReceta.belongsTo(Ingrediente, { foreignKey: 'idIngrediente', as: 'Ingrediente' })
Receta.belongsTo(Producto, { foreignKey: 'idProducto', as: 'Producto' })

const include = [
  { model: DetalleReceta, as: 'ingredientes', include: [{ model: Ingrediente, as: 'Ingrediente' }] },
  { model: Producto, as: 'Producto' }
]

const fmt = (r) => ({
  id:          r.idReceta,
  nombre:      r.nombre,
  descripcion: r.descripcion,
  idProducto:  r.idProducto,
  idSucursal:  r.idSucursal,
  cantPorLote: r.cantPorLote,
  ingredientes: (r.ingredientes || []).map(d => ({
    idIngrediente: d.idIngrediente,
    nombre:        d.Ingrediente?.nombre || '',
    cant:          d.cant,
    unidad:        d.unidad || d.Ingrediente?.unidad || ''
  })),
  productoNombre: r.Producto?.nombre || ''
})

const getAll = async (idSucursal) => {
  const where = {}
  if (idSucursal) where.idSucursal = idSucursal
  const recetas = await Receta.findAll({ where, include })
  return recetas.map(fmt)
}

const getById = async (id) => {
  const receta = await Receta.findByPk(id, { include })
  return receta ? fmt(receta) : null
}

const buscarPorNombreNormalizado = (Modelo, nombre, idSucursal, transaction) =>
  Modelo.findOne({
    where: {
      idSucursal,
      [Op.and]: [sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('nombre'))),
        nombre.trim().toLowerCase()
      )]
    },
    transaction
  })

// Crea la copia de una receta en otra sucursal, buscando el producto y los ingredientes
// equivalentes por nombre. Si algo no existe ahí, esa parte se salta y se avisa.
const copiarAOtraSucursal = async (recetaOriginal, ingredientesConNombre, productoOriginal, idSucursalDestino, transaction) => {
  const avisos = []

  const productoDestino = await buscarPorNombreNormalizado(Producto, productoOriginal.nombre, idSucursalDestino, transaction)
  if (!productoDestino) {
    avisos.push(`No se creó la copia de "${recetaOriginal.nombre}" en una de las sucursales porque no existe ahí el producto "${productoOriginal.nombre}".`)
    return avisos
  }

  const copia = await Receta.create({
    nombre:      recetaOriginal.nombre,
    descripcion: recetaOriginal.descripcion,
    idProducto:  productoDestino.idProducto,
    cantPorLote: recetaOriginal.cantPorLote,
    idSucursal:  idSucursalDestino
  }, { transaction })

  const detalleCopia = []
  for (const ing of ingredientesConNombre) {
    const ingredienteDestino = await buscarPorNombreNormalizado(Ingrediente, ing.nombreOriginal, idSucursalDestino, transaction)
    if (!ingredienteDestino) {
      avisos.push(`A la copia de "${recetaOriginal.nombre}" le falta el ingrediente "${ing.nombreOriginal}" en una de las sucursales (no existe ahí).`)
      continue
    }
    detalleCopia.push({
      idReceta:      copia.idReceta,
      idIngrediente: ingredienteDestino.idIngrediente,
      cant:          ing.cant,
      unidad:        ing.unidad
    })
  }
  if (detalleCopia.length > 0) {
    await DetalleReceta.bulkCreate(detalleCopia, { transaction })
  }

  return avisos
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { ingredientes, ...recetaData } = data
    const receta = await Receta.create(recetaData, { transaction: t })
    if (ingredientes?.length > 0) {
      await DetalleReceta.bulkCreate(
        ingredientes.map(i => ({ ...i, idReceta: receta.idReceta })),
        { transaction: t }
      )
    }

    const ingredientesConNombre = await Promise.all(
      (ingredientes || []).map(async i => {
        const ing = await Ingrediente.findByPk(i.idIngrediente, { transaction: t })
        return { nombreOriginal: ing?.nombre || '', cant: i.cant, unidad: i.unidad }
      })
    )
    const productoOriginal = await Producto.findByPk(recetaData.idProducto, { transaction: t })

    const sucursales = await Sucursal.findAll({ where: { estado: 1 }, transaction: t })
    const avisos = []
    for (const s of sucursales) {
      if (s.idSucursal === recetaData.idSucursal) continue
      const a = await copiarAOtraSucursal(recetaData, ingredientesConNombre, productoOriginal, s.idSucursal, t)
      avisos.push(...a)
    }

    await t.commit()
    const creada = await Receta.findByPk(receta.idReceta, { include })
    return { ...fmt(creada), avisos }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const update = async (id, data) => {
  const t = await sequelize.transaction()
  try {
    const receta = await Receta.findByPk(id)
    if (!receta) return null
    const { ingredientes, ...recetaData } = data
    await receta.update(recetaData, { transaction: t })
    if (ingredientes) {
      await DetalleReceta.destroy({ where: { idReceta: receta.idReceta }, transaction: t })
      await DetalleReceta.bulkCreate(
        ingredientes.map(i => ({ ...i, idReceta: receta.idReceta })),
        { transaction: t }
      )
    }
    await t.commit()
    return fmt(await Receta.findByPk(receta.idReceta, { include }))
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const t = await sequelize.transaction()
  try {
    const receta = await Receta.findByPk(id)
    if (!receta) return false
    await DetalleReceta.destroy({ where: { idReceta: receta.idReceta }, transaction: t })
    await receta.destroy({ transaction: t })
    await t.commit()
    return true
  } catch (err) {
    await t.rollback()
    throw err
  }
}

module.exports = { getAll, getById, create, update, remove }