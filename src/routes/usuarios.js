const router = require('express').Router()
const Usuario = require('../models/Usuario')

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll()
    res.json(usuarios)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/usuarios
router.post('/', async (req, res) => {
  try {
    const usuario = await Usuario.create(req.body)
    res.status(201).json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    await usuario.update(req.body)
    res.json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    await usuario.destroy()
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
