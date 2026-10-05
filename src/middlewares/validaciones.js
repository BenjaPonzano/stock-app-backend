// Reglas de validación de cada recurso, listas para usar en las rutas.
const { validar } = require('./validar')

const { UNIDADES } = require('../utils/unidades')
const PAGOS = ['ef', 'mp', 'td', 'tc']
const ROLES = ['admin', 'vendedor']
const ORIGENES = ['comprado', 'elaborado'] // comprado = se compra hecho; elaborado = se prepara con una receta

// ---- Auth ----
const login = validar({
  nombre:   { tipo: 'texto', requerido: true, max: 100 },
  password: { tipo: 'texto', requerido: true, max: 255 }
})

// ---- Sucursales ----
const reglasSucursal = {
  nombre:    { tipo: 'texto', requerido: true, max: 100 },
  direccion: { tipo: 'texto', max: 200 },
  telefono:  { tipo: 'texto', max: 30 },
  encargado: { tipo: 'texto', max: 100 }
}
const sucursalCrear = validar(reglasSucursal)
const sucursalEditar = validar(reglasSucursal, { parcial: true })

// ---- Usuarios ----
const reglasUsuario = {
  nombre:      { tipo: 'texto', requerido: true, max: 100 },
  apellido:    { tipo: 'texto', requerido: true, max: 100 },
  tipoUsuario: { tipo: 'texto', requerido: true, enum: ROLES, etiqueta: 'El tipo de usuario' },
  password:    { tipo: 'texto', min: 4, max: 100, etiqueta: 'La contraseña' }
}
const vendedorConSucursal = (body) =>
  body.tipoUsuario === 'vendedor' && !body.idSucursal ? ['Un vendedor debe tener una sucursal asignada'] : []

const usuarioCrear = validar(
  { ...reglasUsuario, password: { ...reglasUsuario.password, requerido: true } },
  { extra: vendedorConSucursal }
)
const usuarioEditar = validar(reglasUsuario, { parcial: true, extra: vendedorConSucursal })

// ---- Productos ----
const reglasProducto = {
  nombre:       { tipo: 'texto', requerido: true, max: 100 },
  descripcion:  { tipo: 'texto', max: 255 },
  unidad:       { tipo: 'texto', enum: UNIDADES },
  origen:       { tipo: 'texto', enum: ORIGENES, etiqueta: 'El origen' },
  stock:        { tipo: 'numero', min: 0 },
  stockMin:     { tipo: 'numero', min: 0, etiqueta: 'El stock mínimo' },
  precioVenta:  { tipo: 'numero', min: 0, etiqueta: 'El precio de venta' },
  precioCompra: { tipo: 'numero', min: 0, etiqueta: 'El precio de compra' }
}
const productoCrear = validar(reglasProducto)
const productoEditar = validar(reglasProducto, { parcial: true })

// ---- Ingredientes ----
const reglasIngrediente = {
  nombre:      { tipo: 'texto', requerido: true, max: 100 },
  descripcion: { tipo: 'texto', max: 255 },
  unidad:      { tipo: 'texto', enum: UNIDADES },
  stock:       { tipo: 'numero', min: 0 },
  stockMin:    { tipo: 'numero', min: 0, etiqueta: 'El stock mínimo' },
  precio:      { tipo: 'numero', min: 0 }
}
const ingredienteCrear = validar(reglasIngrediente)
const ingredienteEditar = validar(reglasIngrediente, { parcial: true })

// ---- Recetas ----
const reglasReceta = {
  nombre:      { tipo: 'texto', requerido: true, max: 100 },
  descripcion: { tipo: 'texto', max: 255 },
  idProducto:  { tipo: 'numero', requerido: true, etiqueta: 'El producto que genera' },
  cantPorLote: { tipo: 'numero', minExcl: 0, etiqueta: 'La cantidad por lote' },
  ingredientes: {
    tipo: 'lista', requerido: true, minItems: 1,
    items: {
      idIngrediente: { tipo: 'numero', requerido: true, etiqueta: 'El ingrediente' },
      cant:          { tipo: 'numero', requerido: true, minExcl: 0, etiqueta: 'La cantidad' },
      unidad:        { tipo: 'texto', enum: UNIDADES, etiqueta: 'La unidad' }
    }
  }
}
const recetaCrear = validar(reglasReceta)
const recetaEditar = validar(reglasReceta, { parcial: true })

// ---- Ventas ----
const ventaCrear = validar({
  tipoPago:  { tipo: 'texto', requerido: true, enum: PAGOS, etiqueta: 'El método de pago' },
  descuento: { tipo: 'numero', min: 0, maxValor: 100 },
  total:     { tipo: 'numero', min: 0 },
  items: {
    tipo: 'lista', requerido: true, minItems: 1,
    items: {
      idProducto:     { tipo: 'numero', requerido: true, etiqueta: 'El producto' },
      cant:           { tipo: 'numero', requerido: true, entero: true, min: 1, etiqueta: 'La cantidad' },
      precioUnitario: { tipo: 'numero', requerido: true, min: 0, etiqueta: 'El precio' }
    }
  }
})

// ---- Compras (ingreso de mercadería) ----
const compraCrear = validar({
  proveedor: { tipo: 'texto', requerido: true, max: 100 },
  factura:   { tipo: 'texto', max: 50 },
  obs:       { tipo: 'texto', max: 255 },
  fecha:     { tipo: 'texto', requerido: true },
  items: {
    tipo: 'lista', requerido: true, minItems: 1,
    items: {
      cant:   { tipo: 'numero', requerido: true, minExcl: 0, etiqueta: 'La cantidad' },
      precio: { tipo: 'numero', requerido: true, min: 0, etiqueta: 'El precio' }
    }
  }
})

// ---- Elaboraciones ----
const elaboracionCrear = validar({
  idProducto: { tipo: 'numero', requerido: true, etiqueta: 'El producto' },
  cantidad:   { tipo: 'numero', requerido: true, entero: true, min: 1, etiqueta: 'La cantidad' },
  obs:        { tipo: 'texto', max: 255 },
  ingredientesConsumidos: {
    tipo: 'lista',
    items: {
      idIngrediente: { tipo: 'numero', requerido: true, etiqueta: 'El ingrediente' },
      cant:          { tipo: 'numero', requerido: true, min: 0, etiqueta: 'La cantidad' }
    }
  }
})

module.exports = {
  login,
  sucursalCrear, sucursalEditar,
  usuarioCrear, usuarioEditar,
  productoCrear, productoEditar,
  ingredienteCrear, ingredienteEditar,
  recetaCrear, recetaEditar,
  ventaCrear, compraCrear, elaboracionCrear
}
