const router = require('express').Router()
const ctrl = require('../controllers/compra.controller')
const { verificarToken } = require('../middlewares/auth')

router.get('/',  verificarToken, ctrl.getAll)
router.post('/', verificarToken, ctrl.create)

module.exports = router