const router = require('express').Router()
const ctrl = require('../controllers/receta.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth')
const validaciones = require('../middlewares/validaciones')

router.get('/',       verificarToken, ctrl.getAll)
router.get('/:id',    verificarToken, ctrl.getById)
router.post('/',      verificarToken, soloAdmin, validaciones.recetaCrear, ctrl.create)
router.put('/:id',    verificarToken, soloAdmin, validaciones.recetaEditar, ctrl.update)
router.delete('/:id', verificarToken, soloAdmin, ctrl.remove)

module.exports = router