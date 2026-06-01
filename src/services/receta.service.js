const { Receta, DetalleReceta } = require('../models/Receta')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')

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
  cantPorLote: r.cantPorLote,
  ingredientes: (r.ingredientes || []).map(d => ({
    idIngrediente: d.idIngrediente,
    nombre:        d.Ingrediente?.nombre || '',
    cant:          d.cant,
    unidad:        d.unidad || d.Ingrediente?.unidad || ''
  })),
  productoNombre: r.Producto?.nombre || ''
})

const getAll = async () => {
  const recetas = await Receta.findAll({ include })
  return recetas.map(fmt)
}

const getById = async (id) => {
  const receta = await Receta.findByPk(id, { include })
  return receta ? fmt(receta) : null
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
    await t.commit()
    return fmt(await Receta.findByPk(receta.idReceta, { include }))
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
