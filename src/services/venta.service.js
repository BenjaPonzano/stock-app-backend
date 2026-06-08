const { Venta, DetalleVenta } = require('../models/Venta')
const Producto = require('../models/Producto')
const sequelize = require('../db')

const getAll = async (idSucursal) => {
  const where = idSucursal ? { idSucursal } : {};
  return Venta.findAll({
    where,
    include: [{ model: DetalleVenta, as: 'items' }],
    order: [['fecha', 'DESC']]
  });
}

const getById = async (id) => {
  const venta = await Venta.findByPk(id, { include: [{ model: DetalleVenta, as: 'items' }] })
  return venta || null
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { items, forzada, ...ventaData } = data

    // Verificar stock
    const sinStock = [];
    for (const item of items) {
      const producto = await Producto.findByPk(item.idProducto, { transaction: t });
      if (producto && producto.stock < item.cant) {
        sinStock.push(producto.nombre);
      }
    }

    // Si hay productos sin stock y no se forzó, lanzar error
    if (sinStock.length > 0 && !forzada) {
      await t.rollback();
      return { stockInsuficiente: true, productos: sinStock };
    }

    const venta = await Venta.create({ ...ventaData, forzada: forzada ? 1 : 0 }, { transaction: t })
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
