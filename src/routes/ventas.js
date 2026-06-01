const router = require('express').Router()
const ctrl = require('../controllers/venta.controller')

router.get('/',    ctrl.getAll)
router.get('/:id', ctrl.getById)
router.post('/',   ctrl.create)

module.exports = router
