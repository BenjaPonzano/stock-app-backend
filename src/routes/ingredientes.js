const router = require('express').Router()
const Ingrediente = require('../models/Ingrediente')
const PrecioIngrediente = require('../models/PrecioIngrediente')
const sequelize = require('../db')

async function getPrecioActual(idIngrediente) {
  return PrecioIngrediente.findOne({
    where: { idIngrediente },
    order: [['fecha_desde', 'DESC']]
  })
}

function fmt(ingrediente, precio) {
  return {
    id:          ingrediente.idIngrediente,
    nombre:      ingrediente.nombre,
    descripcion: ingrediente.descripcion,
    categoria:   ingrediente.categoria,
    unidad:      ingrediente.unidad,
    stock:       ingrediente.stock,
    stockMin:    ingrediente.stockMin,
    emoji:       ingrediente.emoji,
    precio:      precio?.precio || 0
  }
}

// GET /api/ingredientes
router.get('/', async (req, res) => {
  try {
    const ingredientes = await Ingrediente.findAll()
    const result = await Promise.all(ingredientes.map(async i => {
      const precio = await getPrecioActual(i.idIngrediente)
      return fmt(i, precio)
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/ingredientes/:id
router.get('/:id', async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findByPk(req.params.id)
    if (!ingrediente) return res.status(404).json({ error: 'Ingrediente no encontrado' })
    const precio = await getPrecioActual(ingrediente.idIngrediente)
    res.json(fmt(ingrediente, precio))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ingredientes
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { precio, ...ingredienteData } = req.body
    const ingrediente = await Ingrediente.create(ingredienteData, { transaction: t })

    if (precio !== undefined) {
      await PrecioIngrediente.create({
        idIngrediente: ingrediente.idIngrediente,
        fecha_desde:   new Date().toISOString().slice(0, 10),
        precio
      }, { transaction: t })
    }

    await t.commit()
    const precioActual = await getPrecioActual(ingrediente.idIngrediente)
    res.status(201).json(fmt(ingrediente, precioActual))
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/ingredientes/:id
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const ingrediente = await Ingrediente.findByPk(req.params.id)
    if (!ingrediente) return res.status(404).json({ error: 'Ingrediente no encontrado' })

    const { precio, ...ingredienteData } = req.body
    await ingrediente.update(ingredienteData, { transaction: t })

    if (precio !== undefined) {
      const hoy = new Date().toISOString().slice(0, 10)
      await PrecioIngrediente.upsert({
        idIngrediente: ingrediente.idIngrediente,
        fecha_desde:   hoy,
        precio
      }, { transaction: t })
    }

    await t.commit()
    const precioActual = await getPrecioActual(ingrediente.idIngrediente)
    res.json(fmt(ingrediente, precioActual))
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/ingredientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findByPk(req.params.id)
    if (!ingrediente) return res.status(404).json({ error: 'Ingrediente no encontrado' })
    await ingrediente.destroy()
    res.json({ mensaje: 'Ingrediente eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
