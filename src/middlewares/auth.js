const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado, token requerido' })
  }

  try {
    const tokenLimpio = token.replace('Bearer ', '')
    const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET)
    req.usuario = verificado
    next()
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' })
  }
}

const soloAdmin = (req, res, next) => {
  if (req.usuario.tipoUsuario !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado, se requiere ser admin' })
  }
  next()
}

module.exports = { verificarToken, soloAdmin }