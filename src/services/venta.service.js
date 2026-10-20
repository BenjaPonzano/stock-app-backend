const { Venta, DetalleVenta } = require('../models/Venta')
const Producto = require('../models/Producto')
const sequelize = require('../db')

const getAll = async (idSucursal) => {
  const where = idSucursal ? { idSucursal } : {}
  return Venta.findAll({ where, include: [{ model: DetalleVenta, as: 'items' }], order: [['fecha', 'DESC']] })
}

const getById = async (id) => {
  const venta = await Venta.findByPk(id, { include: [{ model: DetalleVenta, as: 'items' }] })
  return venta || null
}

const create = async (data) => {
  const { items, forzada, ...ventaData } = data

  if (items?.length > 0) {
    const insuficientes = []
    for (const item of items) {
      const producto = await Producto.findByPk(item.idProducto)
      if (producto && producto.stock < item.cant) {
        insuficientes.push({
          idProducto: producto.idProducto,
          nombre: producto.nombre,
          stockDisponible: producto.stock,
          cantPedida: item.cant
        })
      }
    }
    if (insuficientes.length > 0 && !forzada) {
      const error = new Error('stock_insuficiente')
      error.stockInsuficiente = insuficientes
      throw error
    }
  }

  const t = await sequelize.transaction()
  try {
    const venta = await Venta.create({ ...ventaData, forzada: !!forzada }, { transaction: t })
    if (items?.length > 0) {
      await DetalleVenta.bulkCreate(
        items.map(i => ({ ...i, idCompra: venta.idCompra })),
        { transaction: t }
      )
      for (const item of items) {
        await Producto.decrement('stock', {
          by: item.cant,
          where: { idProducto: item.idProducto },
          transaction: t
        })
      }
    }
    await t.commit()
    return venta
  } catch (err) {
    await t.rollback()
    throw err
  }
}

module.exports = { getAll, getById, create }
