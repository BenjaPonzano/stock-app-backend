// Tests unitarios de la validación de entrada (no necesitan base de datos).
const { chequear } = require('../middlewares/validar')
const validaciones = require('../middlewares/validaciones')

// Corre un middleware con un body y devuelve cómo respondió.
const ejecutar = (middleware, body) => {
  const resultado = { siguio: false }
  const res = {
    status(codigo) { resultado.status = codigo; return this },
    json(cuerpo) { resultado.body = cuerpo; return this }
  }
  middleware({ body }, res, () => { resultado.siguio = true })
  return resultado
}

describe('chequear() - reglas básicas', () => {
  const reglas = {
    nombre: { tipo: 'texto', requerido: true, max: 5 },
    edad:   { tipo: 'numero', min: 0, entero: true }
  }

  test('acepta datos válidos', () => {
    expect(chequear({ nombre: 'Ana', edad: 30 }, reglas)).toEqual([])
  })

  test('marca un campo obligatorio vacío', () => {
    expect(chequear({ nombre: '   ' }, reglas)).toEqual(['nombre es obligatorio'])
  })

  test('marca texto demasiado largo y números inválidos', () => {
    const errores = chequear({ nombre: 'Demasiado', edad: -1.5 }, reglas)
    expect(errores).toHaveLength(3)
  })

  test('en modo parcial ignora los campos ausentes', () => {
    expect(chequear({}, reglas, { parcial: true })).toEqual([])
  })
})

describe('validaciones de recursos', () => {
  test('login: exige usuario y contraseña', () => {
    const r = ejecutar(validaciones.login, {})
    expect(r.status).toBe(400)
    expect(r.body.detalles).toHaveLength(2)
  })

  test('usuario vendedor sin sucursal es rechazado', () => {
    const r = ejecutar(validaciones.usuarioCrear, { nombre: 'A', apellido: 'B', password: '1234', tipoUsuario: 'vendedor' })
    expect(r.status).toBe(400)
    expect(r.body.detalles).toContain('Un vendedor debe tener una sucursal asignada')
  })

  test('usuario: la contraseña necesita al menos 4 caracteres', () => {
    const r = ejecutar(validaciones.usuarioCrear, { nombre: 'A', apellido: 'B', password: 'ab', tipoUsuario: 'admin' })
    expect(r.status).toBe(400)
  })

  test('producto válido pasa al controller', () => {
    const r = ejecutar(validaciones.productoCrear, { nombre: 'Pan', unidad: 'u', stock: 5, origen: 'elaborado' })
    expect(r.siguio).toBe(true)
  })

  test('producto con origen inexistente es rechazado', () => {
    const r = ejecutar(validaciones.productoCrear, { nombre: 'Pan', origen: 'robado' })
    expect(r.status).toBe(400)
  })

  test('venta: exige al menos un ítem y un método de pago válido', () => {
    const r = ejecutar(validaciones.ventaCrear, { tipoPago: 'bitcoin', items: [] })
    expect(r.status).toBe(400)
    expect(r.body.detalles.length).toBeGreaterThanOrEqual(2)
  })

  test('venta válida pasa al controller', () => {
    const r = ejecutar(validaciones.ventaCrear, {
      tipoPago: 'ef', descuento: 10, total: 90,
      items: [{ idProducto: 1, cant: 2, precioUnitario: 50 }]
    })
    expect(r.siguio).toBe(true)
  })

  test('compra: proveedor, fecha e ítems son obligatorios', () => {
    const r = ejecutar(validaciones.compraCrear, {})
    expect(r.status).toBe(400)
    expect(r.body.detalles).toHaveLength(3)
  })
})
