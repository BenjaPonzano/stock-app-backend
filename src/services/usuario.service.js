const Usuario = require('../models/Usuario')
const bcrypt = require('bcryptjs')

const getAll = async () => Usuario.findAll({
  attributes: { exclude: ['password'] }
})

const getById = async (id) => {
  const usuario = await Usuario.findByPk(id, {
    attributes: { exclude: ['password'] }
  })
  return usuario || null
}

const create = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10)
  }
  return Usuario.create(data)
}

const update = async (id, data) => {
  const usuario = await Usuario.findByPk(id)
  if (!usuario) return null
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10)
  }
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