const Sucursal = require('../models/Sucursal')

function fmt(s) {
  return {
    id:        s.idSucursal,
    nombre:    s.nombre,
    direccion: s.direccion,
    telefono:  s.telefono,
    encargado: s.encargado,
    activa:    s.estado === 1
  }
}

const getAll = async () => {
  const sucursales = await Sucursal.findAll()
  return sucursales.map(fmt)
}

const getById = async (id) => {
  const sucursal = await Sucursal.findByPk(id)
  if (!sucursal) return null
  return fmt(sucursal)
}

const create = async (data) => {
  const { activa, ...rest } = data
  const sucursal = await Sucursal.create({ ...rest, estado: activa ? 1 : 0 })
  return fmt(sucursal)
}

const update = async (id, data) => {
  const sucursal = await Sucursal.findByPk(id)
  if (!sucursal) return null
  const { activa, ...rest } = data
  await sucursal.update({ ...rest, estado: activa ? 1 : 0 })
  return fmt(sucursal)
}

const remove = async (id) => {
  const sucursal = await Sucursal.findByPk(id)
  if (!sucursal) return false
  await sucursal.destroy()
  return true
}

module.exports = { getAll, getById, create, update, remove }
