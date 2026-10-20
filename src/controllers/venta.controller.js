const service = require('../services/venta.service')

const getAll = async (req, res, next) => {
  try {
    const sucursal = req.usuario.tipoUsuario === 'admin' ? req.query.sucursal : req.usuario.idSucursal
    res.json(await service.getAll(sucursal))
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Venta no encontrada' })
    res.json(data)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const idSucursal = req.usuario.tipoUsuario === 'admin' ? req.body.idSucursal : req.usuario.idSucursal
    const idUsuario = req.usuario.idUsuario
    res.status(201).json(await service.create({ ...req.body, idSucursal, idUsuario }))
  } catch (err) {
    if (err.stockInsuficiente) {
      return res.status(409).json({ error: 'stock_insuficiente', items: err.stockInsuficiente })
    }
    next(err)
  }
}
module.exports = { getAll, getById, create }