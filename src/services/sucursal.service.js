const Sucursal = require('../models/Sucursal')
const sequelize = require('../db')
const Producto = require('../models/Producto')
const PrecioProducto = require('../models/PrecioProducto')
const Ingrediente = require('../models/Ingrediente')
const PrecioIngrediente = require('../models/PrecioIngrediente')

const precioVigente = (precios = []) =>
  precios.reduce((ult, p) => (!ult || p.fecha_desde > ult.fecha_desde ? p : ult), null)

// Copia a la sucursal nueva los productos e ingredientes que ya existen (uno por nombre), con stock 0
const copiarCatalogo = async (idSucursal, transaction) => {
  const hoy = new Date().toISOString().slice(0, 10)

  const productos = await Producto.findAll({ where: { activo: 1 }, include: [{ model: PrecioProducto, as: 'precios' }], transaction })
  const prodVistos = new Set()
  for (const p of productos) {
    const clave = p.nombre.trim().toLowerCase()
    if (prodVistos.has(clave)) continue
    prodVistos.add(clave)
    const copia = await Producto.create({ nombre: p.nombre, descripcion: p.descripcion, unidad: p.unidad, stock: 0, stockMin: p.stockMin, emoji: p.emoji, origen: p.origen, activo: 1, idSucursal }, { transaction })
    const precio = precioVigente(p.precios)
    if (precio) await PrecioProducto.create({ idProducto: copia.idProducto, fecha_desde: hoy, precio: precio.precio, precioCompra: precio.precioCompra }, { transaction })
  }

  const ingredientes = await Ingrediente.findAll({ where: { activo: 1 }, include: [{ model: PrecioIngrediente, as: 'precios' }], transaction })
  const ingVistos = new Set()
  for (const i of ingredientes) {
    const clave = i.nombre.trim().toLowerCase()
    if (ingVistos.has(clave)) continue
    ingVistos.add(clave)
    const copia = await Ingrediente.create({ nombre: i.nombre, descripcion: i.descripcion, unidad: i.unidad, stock: 0, stockMin: i.stockMin, emoji: i.emoji, activo: 1, idSucursal }, { transaction })
    const precio = precioVigente(i.precios)
    if (precio) await PrecioIngrediente.create({ idIngrediente: copia.idIngrediente, fecha_desde: hoy, precio: precio.precio }, { transaction })
  }
}
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

const getAll = async () => {
  const sucursales = await Sucursal.findAll({ where: { activo: 1 } })
  return sucursales.map(fmt)
}

const getById = async (id) => {
  const sucursal = await Sucursal.findOne({ where: { idSucursal: id, activo: 1 } })
  if (!sucursal) return null
  return fmt(sucursal)
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { activa, ...rest } = data
    const sucursal = await Sucursal.create({ ...rest, estado: activa ? 1 : 0 }, { transaction: t })
    await copiarCatalogo(sucursal.idSucursal, t)
    await t.commit()
    return fmt(sucursal)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const update = async (id, data) => {
  const sucursal = await Sucursal.findOne({ where: { idSucursal: id, activo: 1 } })
  if (!sucursal) return null
  const { activa, ...rest } = data
  await sucursal.update({ ...rest, estado: activa ? 1 : 0 })
  return fmt(sucursal)
}

// Borrado lógico, igual que productos e ingredientes: la sucursal no se borra de la
// tabla (tiene ventas, compras y usuarios asociados), solo se marca como eliminada
// e inactiva, así sus vendedores ya no pueden entrar.
const remove = async (id) => {
  const sucursal = await Sucursal.findOne({ where: { idSucursal: id, activo: 1 } })
  if (!sucursal) return false
  // Su catálogo también se da de baja, para que no queden productos/ingredientes de una sucursal que ya no existe
  await sequelize.transaction(async (t) => {
    await sucursal.update({ activo: 0, estado: 0 }, { transaction: t })
    await Producto.update({ activo: 0 }, { where: { idSucursal: id }, transaction: t })
    await Ingrediente.update({ activo: 0 }, { where: { idSucursal: id }, transaction: t })
  })
  return true
}

module.exports = { getAll, getById, create, update, remove }
