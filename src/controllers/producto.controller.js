const service = require('../services/producto.service')

const getAll = async (req, res) => {
  try {
    const { sucursal } = req.query;
    res.json(await service.getAll(sucursal));
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const create = async (req, res) => {
  try {
    res.status(201).json(await service.create(req.body))
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const remove = async (req, res) => {
  try {
    const ok = await service.remove(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json({ mensaje: 'Producto eliminado' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getAll, getById, create, update, remove }
