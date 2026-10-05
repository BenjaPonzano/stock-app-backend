const router = require('express').Router()
const ctrl = require('../controllers/compra.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth')
const validaciones = require('../middlewares/validaciones')

router.get('/',  verificarToken, soloAdmin, ctrl.getAll)
router.post('/', verificarToken, soloAdmin, validaciones.compraCrear, ctrl.create)

module.exports = router