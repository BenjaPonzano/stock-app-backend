const IngresoMercaderia = require('../models/IngresoMercaderia')
const { SumaIngrediente, SumaProducto } = require('../models/MovimientoStock')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')
const { Op } = require('sequelize')

// Arma un índice { id: registro } con una sola consulta para todos los ids pedidos.
const indexarPorId = async (Modelo, campoId, ids) => {
  if (ids.length === 0) return {}
  const registros = await Modelo.findAll({ where: { [campoId]: { [Op.in]: ids } } })
  return Object.fromEntries(registros.map(r => [r[campoId], r]))
}

// Hace un número fijo de consultas (5) sin importar cuántas compras haya: primero
// las compras, después todos sus ítems juntos y por último los nombres de los
// ingredientes y productos. Antes hacía varias consultas por cada compra (N+1).
const getAll = async (idSucursal) => {
  const where = idSucursal ? { idSucursal } : {}
  const ingresos = await IngresoMercaderia.findAll({ where, order: [['fecha', 'DESC']] })
  const idsIngreso = ingresos.map(i => i.idIngreso)
  const [sumasIng, sumasProd] = idsIngreso.length === 0 ? [[], []] : await Promise.all([
    SumaIngrediente.findAll({ where: { idIngreso: { [Op.in]: idsIngreso } } }),
    SumaProducto.findAll({ where: { idIngreso: { [Op.in]: idsIngreso } } })
  ])
  const [ingredientes, productos] = await Promise.all([
    indexarPorId(Ingrediente, 'idIngrediente', [...new Set(sumasIng.map(s => s.idIngrediente))]),
    indexarPorId(Producto, 'idProducto', [...new Set(sumasProd.map(s => s.idProducto))])
  ])

  return ingresos.map(ing => {
    const itemsIng = sumasIng.filter(s => s.idIngreso === ing.idIngreso).map(s => {
      const ingrediente = ingredientes[s.idIngrediente]
      return { nombre: ingrediente?.nombre || '', tipo: 'ingrediente', cant: s.cant, unidad: ingrediente?.unidad || '', precio: s.precioUnitario, subtotal: s.cant * s.precioUnitario }
    })
    const itemsProd = sumasProd.filter(s => s.idIngreso === ing.idIngreso).map(s => {
      const producto = productos[s.idProducto]
      return { nombre: producto?.nombre || '', tipo: 'producto', cant: s.cant, unidad: producto?.unidad || '', precio: s.precioUnitario, subtotal: s.cant * s.precioUnitario }
    })
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
  })
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { proveedor, factura, obs, fecha, items, idSucursal, idUsuario } = data
    const ingreso = await IngresoMercaderia.create({ proveedor, factura, obs, fecha, idSucursal, idUsuario }, { transaction: t })
    for (const item of items) {
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
        await SumaIngrediente.create({ idIngreso: ingreso.idIngreso, idIngrediente: itemId, idUsuario, idSucursal, cant: item.cant, precioUnitario: item.precio, proveedor, fecha }, { transaction: t })
        await Ingrediente.update(
          { stock: sequelize.literal(`ROUND(stock + ${Number(item.cant)}, 3)`) },
          { where: { idIngrediente: itemId }, transaction: t }
        )
      } else {
        await SumaProducto.create({ idIngreso: ingreso.idIngreso, idProducto: itemId, idUsuario, idSucursal, cant: item.cant, precioUnitario: item.precio, proveedor, fecha }, { transaction: t })
        await Producto.increment('stock', { by: item.cant, where: { idProducto: itemId }, transaction: t })
      }
    }
    await t.commit()
    return { mensaje: 'Compra registrada', idIngreso: ingreso.idIngreso }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

module.exports = { getAll, create }