const router = require('express').Router()
const { Venta, DetalleVenta } = require('../models/Venta')
const Producto = require('../models/Producto')
const sequelize = require('../db')

// GET /api/ventas
router.get('/', async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [{ model: DetalleVenta, as: 'items' }],
      order: [['fecha', 'DESC']]
    })
    res.json(ventas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/ventas/:id
router.get('/:id', async (req, res) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [{ model: DetalleVenta, as: 'items' }]
    })
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' })
    res.json(venta)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ventas
// Body: { idUsuario, idSucursal, total, descuento, tipoPago, items: [{ idProducto, cant, precioUnitario }] }
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { items, ...ventaData } = req.body

    const venta = await Venta.create(ventaData, { transaction: t })

    if (items && items.length > 0) {
      const detalles = items.map(item => ({ ...item, idCompra: venta.idCompra }))
      await DetalleVenta.bulkCreate(detalles, { transaction: t })

      // Descontar stock de cada producto
      for (const item of items) {
        await Producto.decrement('stock', {
          by: item.cant,
          where: { idProducto: item.idProducto },
          transaction: t
        })
      }
    }

    await t.commit()
    res.status(201).json(venta)
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
