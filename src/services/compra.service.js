const IngresoMercaderia = require('../models/IngresoMercaderia')
const { SumaIngrediente, SumaProducto } = require('../models/Compra')
const Ingrediente = require('../models/Ingrediente')
const Producto = require('../models/Producto')
const sequelize = require('../db')

const getAll = async (idSucursal) => {
  const where = idSucursal ? { idSucursal } : {};
  const ingresos = await IngresoMercaderia.findAll({ where, order: [['fecha', 'DESC']] })
  return Promise.all(ingresos.map(async ing => {
    const [sumaIng, sumaProd] = await Promise.all([
      SumaIngrediente.findAll({ where: { idIngreso: ing.idIngreso } }),
      SumaProducto.findAll({ where: { idIngreso: ing.idIngreso } })
    ])
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
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { proveedor, factura, obs, fecha, idSucursal, items } = data
    const ingreso = await IngresoMercaderia.create({ proveedor, factura, obs, fecha, idSucursal }, { transaction: t })
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
        await SumaIngrediente.create({ idIngreso: ingreso.idIngreso, idIngrediente: itemId, cant: item.cant, precioUnitario: item.precio, proveedor, fecha }, { transaction: t })
        await Ingrediente.increment('stock', { by: item.cant, where: { idIngrediente: itemId }, transaction: t })
      } else {
        await SumaProducto.create({ idIngreso: ingreso.idIngreso, idProducto: itemId, cant: item.cant, precioUnitario: item.precio, proveedor, fecha }, { transaction: t })
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
