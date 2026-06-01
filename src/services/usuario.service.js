const Usuario = require('../models/Usuario')

const getAll = async () => Usuario.findAll()

const getById = async (id) => {
  const usuario = await Usuario.findByPk(id)
  return usuario || null
}

const create = async (data) => Usuario.create(data)

const update = async (id, data) => {
  const usuario = await Usuario.findByPk(id)
  if (!usuario) return null
  await usuario.update(data)
  return usuario
}

const remove = async (id) => {
  const usuario = await Usuario.findByPk(id)
  if (!usuario) return false
  await usuario.destroy()
  return true
}

module.exports = { getAll, getById, create, update, remove }
