const router = require('express').Router()
const { Elaboracion, DetalleElaboracion } = require('../models/Elaboracion')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')

// GET /api/elaboraciones — devuelve historial enriquecido
router.get('/', async (req, res) => {
  try {
    const elaboraciones = await Elaboracion.findAll({
      include: [{ model: DetalleElaboracion, as: 'ingredientes' }],
      order: [['fecha', 'DESC']]
    })

    const result = await Promise.all(elaboraciones.map(async e => {
      const producto = await Producto.findByPk(e.idProducto)

      const ingredientesConsumidos = await Promise.all(
        (e.ingredientes || []).map(async d => {
          const ing = await Ingrediente.findByPk(d.idIngrediente)
          return { nombre: ing?.nombre || '', cant: d.cant, unidad: ing?.unidad || '' }
        })
      )

      return {
        id:           'E-' + String(e.idElaboracion).padStart(4, '0'),
        idElaboracion: e.idElaboracion,
        recetaId:     e.idReceta,
        recetaNombre: e.recetaNombre,
        fecha:        e.fecha,
        sucursal:     e.idSucursal,
        cantidad:     e.cantidad,
        obs:          e.obs || '',
        ingredientesConsumidos,
        productoGenerado: {
          nombre:   producto?.nombre || '',
          cantidad: e.cantidad,
          unidad:   producto?.unidad || 'u'
        }
      }
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/elaboraciones
// Body: { idReceta, recetaNombre, idProducto, idSucursal, cantidad, obs, ingredientesConsumidos: [{ idIngrediente, cant }] }
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { ingredientesConsumidos, ...elaboracionData } = req.body

    const elaboracion = await Elaboracion.create(elaboracionData, { transaction: t })

    if (ingredientesConsumidos?.length > 0) {
      const detalles = ingredientesConsumidos.map(i => ({
        idElaboracion:  elaboracion.idElaboracion,
        idIngrediente:  i.idIngrediente,
        cant:           i.cant,
        precioUnitario: i.precioUnitario || 0
      }))
      await DetalleElaboracion.bulkCreate(detalles, { transaction: t })

      // Descontar stock de ingredientes
      for (const i of ingredientesConsumidos) {
        await Ingrediente.decrement('stock', {
          by: i.cant,
          where: { idIngrediente: i.idIngrediente },
          transaction: t
        })
      }
    }

    // Sumar stock del producto generado
    if (elaboracionData.idProducto) {
      await Producto.increment('stock', {
        by: elaboracionData.cantidad,
        where: { idProducto: elaboracionData.idProducto },
        transaction: t
      })
    }

    await t.commit()
    res.status(201).json({ mensaje: 'Elaboración registrada', idElaboracion: elaboracion.idElaboracion })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
