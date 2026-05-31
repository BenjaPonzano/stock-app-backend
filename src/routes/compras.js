const router = require('express').Router()
const IngresoMercaderia = require('../models/IngresoMercaderia')
const { SumaIngrediente, SumaProducto } = require('../models/Compra')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')

// GET /api/compras — devuelve historial agrupado por ingreso
router.get('/', async (req, res) => {
  try {
    const ingresos = await IngresoMercaderia.findAll({ order: [['fecha', 'DESC']] })

    const result = await Promise.all(ingresos.map(async ing => {
      const [sumaIng, sumaProd] = await Promise.all([
        SumaIngrediente.findAll({ where: { idIngreso: ing.idIngreso } }),
        SumaProducto.findAll({ where: { idIngreso: ing.idIngreso } })
      ])

      // Enriquecer con nombres
      const itemsIng = await Promise.all(sumaIng.map(async s => {
        const ingrediente = await Ingrediente.findByPk(s.idIngrediente)
        return { nombre: ingrediente?.nombre || '', tipo: 'ingrediente', cant: s.cant, unidad: ingrediente?.unidad || '', precio: s.precioUnitario, subtotal: s.cant * s.precioUnitario }
      }))
      const itemsProd = await Promise.all(sumaProd.map(async s => {
        const producto = await Producto.findByPk(s.idProducto)
        return { nombre: producto?.nombre || '', tipo: 'producto', cant: s.cant, unidad: producto?.unidad || '', precio: s.precioUnitario, subtotal: s.cant * s.precioUnitario }
      }))

      return {
        id:        'C-' + String(ing.idIngreso).padStart(4, '0'),
        idIngreso: ing.idIngreso,
        proveedor: ing.proveedor,
        factura:   ing.factura || '—',
        obs:       ing.obs || '',
        fecha:     ing.fecha,
        sucursal:  ing.idSucursal,
        items:     [...itemsIng, ...itemsProd]
      }
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/compras
// Body: { proveedor, factura, obs, fecha, sucursal, items: [{ id, tipo, nombre, cant, unidad, precio, subtotal }] }
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { proveedor, factura, obs, fecha, items } = req.body

    const ingreso = await IngresoMercaderia.create(
      { proveedor, factura, obs, fecha },
      { transaction: t }
    )

    for (const item of items) {
      // Buscar el ID por nombre si no viene
      let itemId = item.id
      if (!itemId) {
        if (item.tipo === 'ingrediente') {
          const ing = await Ingrediente.findOne({ where: { nombre: item.nombre } })
          itemId = ing?.idIngrediente
        } else {
          const prod = await Producto.findOne({ where: { nombre: item.nombre } })
          itemId = prod?.idProducto
        }
      }
      if (!itemId) continue

      if (item.tipo === 'ingrediente') {
        await SumaIngrediente.create({
          idIngreso: ingreso.idIngreso,
          idIngrediente: itemId,
          cant: item.cant,
          precioUnitario: item.precio,
          proveedor, fecha
        }, { transaction: t })

        await Ingrediente.increment('stock', {
          by: item.cant,
          where: { idIngrediente: itemId },
          transaction: t
        })
      } else {
        await SumaProducto.create({
          idIngreso: ingreso.idIngreso,
          idProducto: itemId,
          cant: item.cant,
          precioUnitario: item.precio,
          proveedor, fecha
        }, { transaction: t })

        await Producto.increment('stock', {
          by: item.cant,
          where: { idProducto: itemId },
          transaction: t
        })
      }
    }

    await t.commit()
    res.status(201).json({ mensaje: 'Compra registrada', idIngreso: ingreso.idIngreso })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
