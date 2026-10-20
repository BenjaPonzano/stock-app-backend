const router = require('express').Router()
const ctrl = require('../controllers/usuario.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth')
const validaciones = require('../middlewares/validaciones')

router.get('/',       verificarToken, soloAdmin, ctrl.getAll)
router.get('/:id',    verificarToken, soloAdmin, ctrl.getById)
router.post('/',      verificarToken, soloAdmin, validaciones.usuarioCrear, ctrl.create)
router.put('/:id',    verificarToken, soloAdmin, validaciones.usuarioEditar, ctrl.update)
router.delete('/:id', verificarToken, soloAdmin, ctrl.remove)

module.exports = router