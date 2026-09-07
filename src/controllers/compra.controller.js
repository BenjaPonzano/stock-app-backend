const service = require('../services/compra.service')

const getAll = async (req, res) => {
  try {
    const sucursal = req.usuario.tipoUsuario === 'admin' ? req.query.sucursal : req.usuario.idSucursal
    res.json(await service.getAll(sucursal))
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const create = async (req, res) => {
  try {
    const idSucursal = req.usuario.tipoUsuario === 'admin' ? req.body.idSucursal : req.usuario.idSucursal
    const idUsuario = req.usuario.idUsuario
    res.status(201).json(await service.create({ ...req.body, idSucursal, idUsuario }))
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getAll, create }