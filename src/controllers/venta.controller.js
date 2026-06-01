const service = require('../services/venta.service')

const getAll = async (req, res) => {
  try {
    res.json(await service.getAll())
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Venta no encontrada' })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const create = async (req, res) => {
  try {
    res.status(201).json(await service.create(req.body))
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getAll, getById, create }
