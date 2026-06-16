const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Usuario = require('../models/Usuario')

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { nombre, password } = req.body

    const usuario = await Usuario.findOne({ where: { nombre } })
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' })
    }

    const passwordValida = await bcrypt.compare(password, usuario.password)
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' })
    }

    const token = jwt.sign(
      { 
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        tipoUsuario: usuario.tipoUsuario
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, tipoUsuario: usuario.tipoUsuario, nombre: usuario.nombre })

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message })
  }
})

module.exports = router