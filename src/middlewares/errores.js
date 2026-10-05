// Manejo global de errores: todo lo que un controller pase con next(err)
// termina acá y se traduce a una respuesta JSON con el código correcto.

const noEncontrada = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
const manejarErrores = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' })
  }

  // Error de negocio lanzado a propósito (ej.: unidades incompatibles)
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message })
  }

  // El modelo rechazó el dato (campo obligatorio, formato, etc.)
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors.map(e => e.message) })
  }

  // Ya existe un registro igual
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' })
  }

  // Referencia a algo que no existe, o registro usado por otros datos
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ error: 'No se puede completar la operación: el registro está en uso por otros datos (por ejemplo ventas, usuarios o movimientos) o referencia algo que no existe' })
  }

  if (process.env.NODE_ENV !== 'test') console.error(err)

  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { detalle: err.message })
  })
}

module.exports = { noEncontrada, manejarErrores }
