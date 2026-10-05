const router = require('express').Router()
const ctrl = require('../controllers/venta.controller')
const { verificarToken } = require('../middlewares/auth')
const validaciones = require('../middlewares/validaciones')

router.get('/',    verificarToken, ctrl.getAll)
router.get('/:id', verificarToken, ctrl.getById)
router.post('/',   verificarToken, validaciones.ventaCrear, ctrl.create)

module.exports = router