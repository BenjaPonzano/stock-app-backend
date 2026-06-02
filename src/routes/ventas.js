const router = require('express').Router()
const ctrl = require('../controllers/venta.controller')
const { verificarToken } = require('../middlewares/auth')

router.get('/',    verificarToken, ctrl.getAll)
router.get('/:id', verificarToken, ctrl.getById)
router.post('/',   verificarToken, ctrl.create)

module.exports = router