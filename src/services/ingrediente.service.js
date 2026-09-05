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
  categoria:   ingrediente.categoria,
  unidad:      ingrediente.unidad,
  stock:       ingrediente.stock,
  stockMin:    ingrediente.stockMin,
  emoji:       ingrediente.emoji,
  precio:      precio?.precio || 0
})

const getAll = async (idSucursal) => {
  const where = { activo: 1 }
  if (idSucursal) where.idSucursal = idSucursal
  const ingredientes = await Ingrediente.findAll({ where })
  return Promise.all(ingredientes.map(async i => fmt(i, await getPrecioActual(i.idIngrediente))))
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
      categoria:   ingredienteOriginal.categoria,
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

const update = async (id, data) => {
  const t = await sequelize.transaction()
  try {
    const ingrediente = await Ingrediente.findByPk(id)
    if (!ingrediente) return null
    const { precio, ...ingredienteData } = data
    await ingrediente.update(ingredienteData, { transaction: t })
    if (precio !== undefined) {
      await PrecioIngrediente.upsert({
        idIngrediente: ingrediente.idIngrediente,
        fecha_desde:   new Date().toISOString().slice(0, 10),
        precio
      }, { transaction: t })
    }
    await t.commit()
    return fmt(ingrediente, await getPrecioActual(ingrediente.idIngrediente))
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const ingrediente = await Ingrediente.findByPk(id)
  if (!ingrediente) return false
  await ingrediente.update({ activo: 0 })
  return true
}

module.exports = { getAll, getById, create, update, remove }