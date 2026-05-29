const router = require('express').Router()
const { Receta, DetalleReceta } = require('../models/Receta')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')

function fmt(r) {
  return {
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
  }
}

const include = [
  { model: DetalleReceta, as: 'ingredientes', include: [{ model: Ingrediente, as: 'Ingrediente' }] },
  { model: Producto, as: 'Producto' }
]

// Asociaciones necesarias para el include
DetalleReceta.belongsTo(Ingrediente, { foreignKey: 'idIngrediente', as: 'Ingrediente' })
Receta.belongsTo(Producto, { foreignKey: 'idProducto', as: 'Producto' })

// GET /api/recetas
router.get('/', async (req, res) => {
  try {
    const recetas = await Receta.findAll({ include })
    res.json(recetas.map(fmt))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/recetas/:id
router.get('/:id', async (req, res) => {
  try {
    const receta = await Receta.findByPk(req.params.id, { include })
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' })
    res.json(fmt(receta))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/recetas
// Body: { nombre, descripcion, idProducto, cantPorLote, ingredientes: [{ idIngrediente, cant, unidad }] }
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { ingredientes, ...recetaData } = req.body
    const receta = await Receta.create(recetaData, { transaction: t })

    if (ingredientes?.length > 0) {
      const detalles = ingredientes.map(i => ({ ...i, idReceta: receta.idReceta }))
      await DetalleReceta.bulkCreate(detalles, { transaction: t })
    }

    await t.commit()
    const completa = await Receta.findByPk(receta.idReceta, { include })
    res.status(201).json(fmt(completa))
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/recetas/:id
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const receta = await Receta.findByPk(req.params.id)
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' })

    const { ingredientes, ...recetaData } = req.body
    await receta.update(recetaData, { transaction: t })

    if (ingredientes) {
      await DetalleReceta.destroy({ where: { idReceta: receta.idReceta }, transaction: t })
      const detalles = ingredientes.map(i => ({ ...i, idReceta: receta.idReceta }))
      await DetalleReceta.bulkCreate(detalles, { transaction: t })
    }

    await t.commit()
    const completa = await Receta.findByPk(receta.idReceta, { include })
    res.json(fmt(completa))
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/recetas/:id
router.delete('/:id', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const receta = await Receta.findByPk(req.params.id)
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' })
    await DetalleReceta.destroy({ where: { idReceta: receta.idReceta }, transaction: t })
    await receta.destroy({ transaction: t })
    await t.commit()
    res.json({ mensaje: 'Receta eliminada' })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
