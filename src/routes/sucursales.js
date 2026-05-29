const router = require('express').Router()
const Sucursal = require('../models/Sucursal')

// Mapea los campos del modelo al formato que espera el frontend
function fmt(s) {
  return {
    id:        s.idSucursal,
    nombre:    s.nombre,
    direccion: s.direccion,
    telefono:  s.telefono,
    encargado: s.encargado,
    activa:    s.estado === 1
  }
}

// GET /api/sucursales
router.get('/', async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll()
    res.json(sucursales.map(fmt))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sucursales/:id
router.get('/:id', async (req, res) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id)
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' })
    res.json(fmt(sucursal))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sucursales
router.post('/', async (req, res) => {
  try {
    const { activa, ...rest } = req.body
    const sucursal = await Sucursal.create({ ...rest, estado: activa ? 1 : 0 })
    res.status(201).json(fmt(sucursal))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sucursales/:id
router.put('/:id', async (req, res) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id)
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' })
    const { activa, ...rest } = req.body
    await sucursal.update({ ...rest, estado: activa ? 1 : 0 })
    res.json(fmt(sucursal))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/sucursales/:id
router.delete('/:id', async (req, res) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id)
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' })
    await sucursal.destroy()
    res.json({ mensaje: 'Sucursal eliminada' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
