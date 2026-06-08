const service = require('../services/venta.service')

const getAll = async (req, res) => {
  try {
    const { sucursal } = req.query;
    res.json(await service.getAll(sucursal));
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
    const resultado = await service.create(req.body)
    if (resultado?.stockInsuficiente) {
      return res.status(409).json({ stockInsuficiente: true, productos: resultado.productos })
    }
    res.status(201).json(resultado)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getAll, getById, create }
