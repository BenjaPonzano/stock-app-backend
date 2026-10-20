// Validación de entrada para la API.
// Cada regla describe un campo del body; si algo no cumple se responde 400
// con la lista de problemas, antes de llegar al controller.
//
// Tipos soportados: 'texto', 'numero', 'lista'
// Opciones: requerido, max (largo), min (largo o valor), maxValor, entero,
//           enum, minItems, items (reglas de cada elemento de una lista)

const estaVacio = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

const chequear = (obj, reglas, { parcial = false, prefijo = '' } = {}) => {
  const errores = []

  for (const [campo, r] of Object.entries(reglas)) {
    const nombre = prefijo + (r.etiqueta || campo)
    const valor = obj[campo]

    // En una modificación parcial, un campo ausente simplemente no se toca.
    if (parcial && valor === undefined) continue

    if (estaVacio(valor)) {
      if (r.requerido) errores.push(`${nombre} es obligatorio`)
      continue
    }

    if (r.tipo === 'texto') {
      if (typeof valor !== 'string' && typeof valor !== 'number') {
        errores.push(`${nombre} debe ser texto`)
        continue
      }
      const texto = String(valor)
      if (r.max && texto.length > r.max) errores.push(`${nombre} no puede superar los ${r.max} caracteres`)
      if (r.min && texto.length < r.min) errores.push(`${nombre} debe tener al menos ${r.min} caracteres`)
      if (r.enum && !r.enum.includes(texto)) errores.push(`${nombre} debe ser uno de: ${r.enum.join(', ')}`)
    }

    if (r.tipo === 'numero') {
      const n = Number(valor)
      if (typeof valor === 'boolean' || !Number.isFinite(n)) {
        errores.push(`${nombre} debe ser un número`)
        continue
      }
      if (r.entero && !Number.isInteger(n)) errores.push(`${nombre} debe ser un número entero`)
      if (r.min !== undefined && n < r.min) errores.push(`${nombre} debe ser mayor o igual a ${r.min}`)
      if (r.minExcl !== undefined && n <= r.minExcl) errores.push(`${nombre} debe ser mayor a ${r.minExcl}`)
      if (r.maxValor !== undefined && n > r.maxValor) errores.push(`${nombre} debe ser menor o igual a ${r.maxValor}`)
    }

    if (r.tipo === 'lista') {
      if (!Array.isArray(valor)) {
        errores.push(`${nombre} debe ser una lista`)
        continue
      }
      if (r.minItems && valor.length < r.minItems) {
        errores.push(`${nombre} debe tener al menos ${r.minItems} elemento(s)`)
      }
      if (r.items) {
        valor.forEach((el, i) => {
          if (el === null || typeof el !== 'object') {
            errores.push(`${nombre}[${i + 1}] no es válido`)
            return
          }
          errores.push(...chequear(el, r.items, { prefijo: `${nombre}[${i + 1}].` }))
        })
      }
    }
  }

  return errores
}

// Devuelve un middleware de Express.
// extra(body) es opcional: para reglas que cruzan varios campos.
const validar = (reglas, { parcial = false, extra } = {}) => (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const errores = chequear(body, reglas, { parcial })
  if (extra) errores.push(...extra(body))

  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores })
  }
  next()
}

module.exports = { validar, chequear }
