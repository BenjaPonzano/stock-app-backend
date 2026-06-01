const Producto = require('../models/Producto')
const PrecioProducto = require('../models/PrecioProducto')
const sequelize = require('../db')

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

const getAll = async () => {
  const productos = await Producto.findAll()
  return Promise.all(productos.map(async p => fmt(p, await getPrecioActual(p.idProducto))))
}

const getById = async (id) => {
  const producto = await Producto.findByPk(id)
  if (!producto) return null
  return fmt(producto, await getPrecioActual(producto.idProducto))
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
  await producto.destroy()
  return true
}

module.exports = { getAll, getById, create, update, remove }
