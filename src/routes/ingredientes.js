const router = require('express').Router()
const ctrl = require('../controllers/ingrediente.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth')
const validaciones = require('../middlewares/validaciones')

router.get('/',       verificarToken, ctrl.getAll)
router.get('/:id',    verificarToken, ctrl.getById)
router.post('/',      verificarToken, soloAdmin, validaciones.ingredienteCrear, ctrl.create)
router.put('/:id',    verificarToken, soloAdmin, validaciones.ingredienteEditar, ctrl.update)
router.delete('/:id', verificarToken, soloAdmin, ctrl.remove)

module.exports = router