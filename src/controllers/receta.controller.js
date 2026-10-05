const service = require('../services/receta.service')

const getAll = async (req, res, next) => {
  try {
    const sucursal = req.usuario.tipoUsuario === 'admin' ? req.query.sucursal : req.usuario.idSucursal
    res.json(await service.getAll(sucursal))
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Receta no encontrada' })
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
    if (!data) return res.status(404).json({ error: 'Receta no encontrada' })
    res.json(data)
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    const ok = await service.remove(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Receta no encontrada' })
    res.json({ mensaje: 'Receta eliminada' })
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, remove }
