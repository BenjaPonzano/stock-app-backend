const Producto = require('../models/Producto')
const PrecioProducto = require('../models/PrecioProducto')
const Sucursal = require('../models/Sucursal')
const sequelize = require('../db')
const { Op } = require('sequelize')

const getPrecioActual = async (idProducto) =>
  PrecioProducto.findOne({ where: { idProducto }, order: [['fecha_desde', 'DESC']] })

const fmt = (producto, precio) => ({
  id:           producto.idProducto,
  nombre:       producto.nombre,
  descripcion:  producto.descripcion,
  categoria:    producto.categoria,
  unidad:       producto.unidad,
  stock:        producto.stock,
  stockMin:     producto.stockMin,
  emoji:        producto.emoji,
  precioVenta:  precio?.precio       || 0,
  precioCompra: precio?.precioCompra || 0
})

const getAll = async (idSucursal) => {
  const where = { activo: 1 }
  if (idSucursal) where.idSucursal = idSucursal
  const productos = await Producto.findAll({ where })
  return Promise.all(productos.map(async p => fmt(p, await getPrecioActual(p.idProducto))))
}

const getById = async (id) => {
  const producto = await Producto.findByPk(id)
  if (!producto) return null
  return fmt(producto, await getPrecioActual(producto.idProducto))
}

// Busca, dentro de una sucursal puntual, un producto cuyo nombre coincida
// sin importar mayúsculas/minúsculas ni espacios de más.
const buscarPorNombre = (nombre, idSucursal, transaction) =>
  Producto.findOne({
    where: {
      idSucursal,
      [Op.and]: [sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('nombre'))),
        nombre.trim().toLowerCase()
      )]
    },
    transaction
  })

// Al crear un producto en una sucursal, si no existe uno con el mismo nombre
// en las demás sucursales activas, se crea ahí también con stock 0 (mismo precio).
const propagarAOtrasSucursales = async (productoOriginal, precioVenta, precioCompra, transaction) => {
  const sucursales = await Sucursal.findAll({ where: { estado: 1 }, transaction })
  for (const s of sucursales) {
    if (s.idSucursal === productoOriginal.idSucursal) continue
    const yaExiste = await buscarPorNombre(productoOriginal.nombre, s.idSucursal, transaction)
    if (yaExiste) continue
    const copia = await Producto.create({
      nombre:      productoOriginal.nombre,
      descripcion: productoOriginal.descripcion,
      categoria:   productoOriginal.categoria,
      unidad:      productoOriginal.unidad,
      stock:       0,
      stockMin:    productoOriginal.stockMin,
      emoji:       productoOriginal.emoji,
      activo:      1,
      idSucursal:  s.idSucursal
    }, { transaction })
    await PrecioProducto.create({
      idProducto:   copia.idProducto,
      fecha_desde:  new Date().toISOString().slice(0, 10),
      precio:       precioVenta || 0,
      precioCompra: precioCompra || 0
    }, { transaction })
  }
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { precioVenta, precioCompra, ...productoData } = data
    const producto = await Producto.create(productoData, { transaction: t })
    if (precioVenta !== undefined) {
      await PrecioProducto.create({
        idProducto:   producto.idProducto,
        fecha_desde:  new Date().toISOString().slice(0, 10),
        precio:       precioVenta,
        precioCompra: precioCompra || 0
      }, { transaction: t })
    }
    await propagarAOtrasSucursales(producto, precioVenta, precioCompra, t)
    await t.commit()
    return fmt(producto, await getPrecioActual(producto.idProducto))
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const update = async (id, data) => {
  const t = await sequelize.transaction()
  try {
    const producto = await Producto.findByPk(id)
    if (!producto) return null
    const { precioVenta, precioCompra, ...productoData } = data
    await producto.update(productoData, { transaction: t })
    if (precioVenta !== undefined) {
      await PrecioProducto.upsert({
        idProducto:   producto.idProducto,
        fecha_desde:  new Date().toISOString().slice(0, 10),
        precio:       precioVenta,
        precioCompra: precioCompra || 0
      }, { transaction: t })
    }
    await t.commit()
    return fmt(producto, await getPrecioActual(producto.idProducto))
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const producto = await Producto.findByPk(id)
  if (!producto) return false
  await producto.update({ activo: 0 })
  return true
}

module.exports = { getAll, getById, create, update, remove }