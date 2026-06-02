const router = require('express').Router()
const ctrl = require('../controllers/sucursal.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth')

router.get('/',       verificarToken, ctrl.getAll)
router.get('/:id',    verificarToken, ctrl.getById)
router.post('/',      verificarToken, soloAdmin, ctrl.create)
router.put('/:id',    verificarToken, soloAdmin, ctrl.update)
router.delete('/:id', verificarToken, soloAdmin, ctrl.remove)

module.exports = router