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
  const sucursales = await Sucursal.findAll({ where: { activo: 1 } })
  return sucursales.map(fmt)
}

const getById = async (id) => {
  const sucursal = await Sucursal.findOne({ where: { idSucursal: id, activo: 1 } })
  if (!sucursal) return null
  return fmt(sucursal)
}

const create = async (data) => {
  const { activa, ...rest } = data
  const sucursal = await Sucursal.create({ ...rest, estado: activa ? 1 : 0 })
  return fmt(sucursal)
}

const update = async (id, data) => {
  const sucursal = await Sucursal.findOne({ where: { idSucursal: id, activo: 1 } })
  if (!sucursal) return null
  const { activa, ...rest } = data
  await sucursal.update({ ...rest, estado: activa ? 1 : 0 })
  return fmt(sucursal)
}

// Borrado lógico, igual que productos e ingredientes: la sucursal no se borra de la
// tabla (tiene ventas, compras y usuarios asociados), solo se marca como eliminada
// e inactiva, así sus vendedores ya no pueden entrar.
const remove = async (id) => {
  const sucursal = await Sucursal.findOne({ where: { idSucursal: id, activo: 1 } })
  if (!sucursal) return false
  await sucursal.update({ activo: 0, estado: 0 })
  return true
}

module.exports = { getAll, getById, create, update, remove }
