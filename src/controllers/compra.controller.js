const service = require('../services/compra.service')

const getAll = async (req, res, next) => {
  try {
    const sucursal = req.usuario.tipoUsuario === 'admin' ? req.query.sucursal : req.usuario.idSucursal
    res.json(await service.getAll(sucursal))
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const idSucursal = req.usuario.tipoUsuario === 'admin' ? req.body.idSucursal : req.usuario.idSucursal
    const idUsuario = req.usuario.idUsuario
    res.status(201).json(await service.create({ ...req.body, idSucursal, idUsuario }))
  } catch (err) { next(err) }
}

module.exports = { getAll, create }