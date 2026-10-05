const service = require('../services/usuario.service')

const getAll = async (req, res, next) => {
  try {
    res.json(await service.getAll())
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(data)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.body))
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(data)
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    const ok = await service.remove(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, remove }
