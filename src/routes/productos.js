const router = require('express').Router()
const Producto = require('../models/Producto')
const PrecioProducto = require('../models/PrecioProducto')
const sequelize = require('../db')

// Obtiene el precio más reciente de un producto
async function getPrecioActual(idProducto) {
  return PrecioProducto.findOne({
    where: { idProducto },
    order: [['fecha_desde', 'DESC']]
  })
}

// Mapea al formato que espera el frontend
function fmt(producto, precio) {
  return {
    id:           producto.idProducto,
    nombre:       producto.nombre,
    descripcion:  producto.descripcion,
    categoria:    producto.categoria,
    unidad:       producto.unidad,
    stock:        producto.stock,
    stockMin:     producto.stockMin,
    emoji:        producto.emoji,
    precioVenta:  precio?.precio      || 0,
    precioCompra: precio?.precioCompra || 0
  }
}

// GET /api/productos
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.findAll()
    const result = await Promise.all(productos.map(async p => {
      const precio = await getPrecioActual(p.idProducto)
      return fmt(p, precio)
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id)
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })
    const precio = await getPrecioActual(producto.idProducto)
    res.json(fmt(producto, precio))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/productos
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { precioVenta, precioCompra, ...productoData } = req.body
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
    const precio = await getPrecioActual(producto.idProducto)
    res.status(201).json(fmt(producto, precio))
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const producto = await Producto.findByPk(req.params.id)
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })

    const { precioVenta, precioCompra, ...productoData } = req.body
    await producto.update(productoData, { transaction: t })

    // Si cambiaron los precios, insertar nueva entrada histórica
    if (precioVenta !== undefined) {
      const hoy = new Date().toISOString().slice(0, 10)
      await PrecioProducto.upsert({
        idProducto:   producto.idProducto,
        fecha_desde:  hoy,
        precio:       precioVenta,
        precioCompra: precioCompra || 0
      }, { transaction: t })
    }

    await t.commit()
    const precio = await getPrecioActual(producto.idProducto)
    res.json(fmt(producto, precio))
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/productos/:id
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id)
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })
    await producto.destroy()
    res.json({ mensaje: 'Producto eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
