// Tests unitarios del manejo global de errores (no necesitan base de datos).
const { manejarErrores, noEncontrada } = require('../middlewares/errores')

const respuestaFalsa = () => {
  const res = { headersSent: false }
  res.status = (codigo) => { res.codigo = codigo; return res }
  res.json = (cuerpo) => { res.cuerpo = cuerpo; return res }
  return res
}

beforeAll(() => { process.env.NODE_ENV = 'test' })

describe('manejarErrores', () => {
  test('JSON mal formado responde 400', () => {
    const res = respuestaFalsa()
    manejarErrores({ type: 'entity.parse.failed' }, {}, res, () => {})
    expect(res.codigo).toBe(400)
  })

  test('error de validación de Sequelize responde 400 con detalles', () => {
    const res = respuestaFalsa()
    manejarErrores({ name: 'SequelizeValidationError', errors: [{ message: 'proveedor cannot be null' }] }, {}, res, () => {})
    expect(res.codigo).toBe(400)
    expect(res.cuerpo.detalles).toEqual(['proveedor cannot be null'])
  })

  test('registro duplicado responde 409', () => {
    const res = respuestaFalsa()
    manejarErrores({ name: 'SequelizeUniqueConstraintError' }, {}, res, () => {})
    expect(res.codigo).toBe(409)
  })

  test('un error de negocio con status responde con ese código y su mensaje', () => {
    const res = respuestaFalsa()
    manejarErrores(Object.assign(new Error('Unidades incompatibles'), { status: 400 }), {}, res, () => {})
    expect(res.codigo).toBe(400)
    expect(res.cuerpo.error).toBe('Unidades incompatibles')
  })

  test('un error desconocido responde 500', () => {
    const res = respuestaFalsa()
    manejarErrores(new Error('se rompió'), {}, res, () => {})
    expect(res.codigo).toBe(500)
    expect(res.cuerpo.error).toBe('Error interno del servidor')
  })
})

describe('noEncontrada', () => {
  test('responde 404 con la ruta pedida', () => {
    const res = respuestaFalsa()
    noEncontrada({ method: 'GET', originalUrl: '/api/nada' }, res)
    expect(res.codigo).toBe(404)
    expect(res.cuerpo.error).toContain('/api/nada')
  })
})
