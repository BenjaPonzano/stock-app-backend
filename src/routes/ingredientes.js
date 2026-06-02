const router = require('express').Router()
const ctrl = require('../controllers/ingrediente.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth')

router.get('/',       ctrl.getAll)
router.get('/:id',    ctrl.getById)
router.post('/',      verificarToken, soloAdmin, ctrl.create)
router.put('/:id',    verificarToken, soloAdmin, ctrl.update)
router.delete('/:id', verificarToken, soloAdmin, ctrl.remove)

module.exports = router