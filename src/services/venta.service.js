const { Venta, DetalleVenta } = require('../models/Venta')
const Producto = require('../models/Producto')
const Usuario = require('../models/Usuario')
const sequelize = require('../db')
const { Op } = require('sequelize')

// El detalle de venta solo guarda idProducto y la venta solo idUsuario: se agregan
// nombre y emoji de cada producto y el nombre del vendedor, buscándolos todos juntos
// en una consulta por tabla (sin N+1).
const agregarNombres = async (ventas) => {
  const ids = [...new Set(ventas.flatMap(v => (v.items || []).map(i => i.idProducto)))]
  const idsUsuario = [...new Set(ventas.map(v => v.idUsuario).filter(Boolean))]
  const [productos, usuarios] = await Promise.all([
    ids.length ? Producto.findAll({ where: { idProducto: { [Op.in]: ids } } }) : [],
    idsUsuario.length ? Usuario.findAll({ where: { idUsuario: { [Op.in]: idsUsuario } }, attributes: ['idUsuario', 'nombre', 'apellido'] }) : []
  ])
  const porId = Object.fromEntries(productos.map(p => [p.idProducto, p]))
  const usuarioPorId = Object.fromEntries(usuarios.map(u => [u.idUsuario, `${u.nombre} ${u.apellido}`.trim()]))
  return ventas.map(v => {
    const venta = v.toJSON()
    venta.vendedor = usuarioPorId[venta.idUsuario] || null
    venta.items = (venta.items || []).map(i => ({
      ...i,
      nombre: porId[i.idProducto]?.nombre || '',
      emoji:  porId[i.idProducto]?.emoji || null
    }))
    return venta
  })
}

const getAll = async (idSucursal) => {
  const where = idSucursal ? { idSucursal } : {}
  const ventas = await Venta.findAll({ where, include: [{ model: DetalleVenta, as: 'items' }], order: [['fecha', 'DESC']] })
  return agregarNombres(ventas)
}

const getById = async (id) => {
  const venta = await Venta.findByPk(id, { include: [{ model: DetalleVenta, as: 'items' }] })
  if (!venta) return null
  const [conNombres] = await agregarNombres([venta])
  return conNombres
}

const create = async (data) => {
  const { items, forzada, ...ventaData } = data

  if (items?.length > 0) {
    const insuficientes = []
    for (const item of items) {
      const producto = await Producto.findByPk(item.idProducto)
      // Solo se puede vender lo que es de la sucursal de la venta (si no, se descontaría stock de otra)
      if (!producto || !producto.activo || (ventaData.idSucursal && producto.idSucursal !== Number(ventaData.idSucursal))) {
        throw Object.assign(new Error(`El producto ${item.idProducto} no existe en esta sucursal`), { status: 400 })
      }
      if (producto.stock < item.cant) {
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
