const Ingrediente = require('../models/Ingrediente')
const PrecioIngrediente = require('../models/PrecioIngrediente')
const Sucursal = require('../models/Sucursal')
const sequelize = require('../db')
const { Op } = require('sequelize')

const getPrecioActual = async (idIngrediente) =>
  PrecioIngrediente.findOne({ where: { idIngrediente }, order: [['fecha_desde', 'DESC']] })

const fmt = (ingrediente, precio) => ({
  id:          ingrediente.idIngrediente,
  nombre:      ingrediente.nombre,
  descripcion: ingrediente.descripcion,
  unidad:      ingrediente.unidad,
  stock:       ingrediente.stock,
  stockMin:    ingrediente.stockMin,
  emoji:       ingrediente.emoji,
  precio:      precio?.precio || 0
})

// De todos los precios de un ingrediente, el vigente es el de fecha_desde más reciente.
const precioVigente = (precios = []) =>
  precios.reduce((ultimo, p) => (!ultimo || p.fecha_desde > ultimo.fecha_desde ? p : ultimo), null)

// Trae los ingredientes con sus precios en una sola consulta (include), en vez de
// hacer una consulta de precio por cada ingrediente (problema N+1).
const getAll = async (idSucursal) => {
  const where = { activo: 1 }
  if (idSucursal) where.idSucursal = idSucursal
  const ingredientes = await Ingrediente.findAll({
    where,
    include: [{ model: PrecioIngrediente, as: 'precios' }]
  })
  return ingredientes.map(i => fmt(i, precioVigente(i.precios)))
}

const getById = async (id) => {
  const ingrediente = await Ingrediente.findByPk(id)
  if (!ingrediente) return null
  return fmt(ingrediente, await getPrecioActual(ingrediente.idIngrediente))
}

const buscarPorNombre = (nombre, idSucursal, transaction) =>
  Ingrediente.findOne({
    where: {
      idSucursal,
      [Op.and]: [sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('nombre'))),
        nombre.trim().toLowerCase()
      )]
    },
    transaction
  })

const propagarAOtrasSucursales = async (ingredienteOriginal, precio, transaction) => {
  const sucursales = await Sucursal.findAll({ where: { estado: 1 }, transaction })
  for (const s of sucursales) {
    if (s.idSucursal === ingredienteOriginal.idSucursal) continue
    const yaExiste = await buscarPorNombre(ingredienteOriginal.nombre, s.idSucursal, transaction)
    if (yaExiste) continue
    const copia = await Ingrediente.create({
      nombre:      ingredienteOriginal.nombre,
      descripcion: ingredienteOriginal.descripcion,
      unidad:      ingredienteOriginal.unidad,
      stock:       0,
      stockMin:    ingredienteOriginal.stockMin,
      emoji:       ingredienteOriginal.emoji,
      activo:      1,
      idSucursal:  s.idSucursal
    }, { transaction })
    await PrecioIngrediente.create({
      idIngrediente: copia.idIngrediente,
      fecha_desde:   new Date().toISOString().slice(0, 10),
      precio:        precio || 0
    }, { transaction })
  }
}

const create = async (data) => {
  const t = await sequelize.transaction()
  try {
    const { precio, ...ingredienteData } = data
    const ingrediente = await Ingrediente.create(ingredienteData, { transaction: t })
    if (precio !== undefined) {
      await PrecioIngrediente.create({
        idIngrediente: ingrediente.idIngrediente,
        fecha_desde:   new Date().toISOString().slice(0, 10),
        precio
      }, { transaction: t })
    }
    await propagarAOtrasSucursales(ingrediente, precio, t)
    await t.commit()
    return fmt(ingrediente, await getPrecioActual(ingrediente.idIngrediente))
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// Datos del catálogo que son iguales en todas las sucursales. El stock y el stock
// mínimo no se copian: son propios de cada sucursal.
const CAMPOS_COMPARTIDOS = ['nombre', 'descripcion', 'unidad', 'emoji']

// Las copias del mismo ingrediente en las otras sucursales (mismo nombre, sin
// importar mayúsculas ni espacios de más).
const copiasEnOtrasSucursales = (ingrediente, transaction) =>
  Ingrediente.findAll({
    where: {
      activo: 1,
      idSucursal: { [Op.ne]: ingrediente.idSucursal },
      [Op.and]: [sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('nombre'))),
        ingrediente.nombre.trim().toLowerCase()
      )]
    },
    transaction
  })

const update = async (id, data) => {
  const t = await sequelize.transaction()
  try {
    const ingrediente = await Ingrediente.findByPk(id)
    if (!ingrediente) return null
    const { precio, ...ingredienteData } = data
    const copias = await copiasEnOtrasSucursales(ingrediente, t)
    await ingrediente.update(ingredienteData, { transaction: t })
    if (precio !== undefined) {
      await PrecioIngrediente.upsert({
        idIngrediente: ingrediente.idIngrediente,
        fecha_desde:   new Date().toISOString().slice(0, 10),
        precio
      }, { transaction: t })
    }
    // Lo editado en una sucursal se aplica igual en las demás (salvo el stock).
    const compartidos = Object.fromEntries(CAMPOS_COMPARTIDOS.filter(c => c in ingredienteData).map(c => [c, ingredienteData[c]]))
    for (const copia of copias) {
      await copia.update(compartidos, { transaction: t })
      if (precio !== undefined) {
        await PrecioIngrediente.upsert({
          idIngrediente: copia.idIngrediente,
          fecha_desde:   new Date().toISOString().slice(0, 10),
          precio
        }, { transaction: t })
      }
    }
    await t.commit()
    return fmt(ingrediente, await getPrecioActual(ingrediente.idIngrediente))
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// Borrado lógico en todas las sucursales, igual que la edición.
const remove = async (id) => {
  const ingrediente = await Ingrediente.findByPk(id)
  if (!ingrediente) return false
  const copias = await copiasEnOtrasSucursales(ingrediente)
  for (const r of [ingrediente, ...copias]) await r.update({ activo: 0 })
  return true
}

module.exports = { getAll, getById, create, update, remove }