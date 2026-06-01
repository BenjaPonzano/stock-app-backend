const { Venta, DetalleVenta } = require('../models/Venta')
const Producto = require('../models/Producto')
const sequelize = require('../db')

const getAll = async () =>
  Venta.findAll({ include: [{ model: DetalleVenta, as: 'items' }], order: [['fecha', 'DESC']] })

const getById = async (id) => {
  const venta = await Venta.findByPk(id, { include: [{ model: DetalleVenta, as: 'items' }] })
  return venta || null
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { items, ...ventaData } = data
    const venta = await Venta.create(ventaData, { transaction: t })
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
