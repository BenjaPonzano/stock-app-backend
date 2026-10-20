// Prepara una base vacía para que la app se pueda usar sin cargar nada a mano.
// - sequelize.sync() crea las tablas que falten (no toca las que ya existen).
// - Si no hay ningún usuario, crea una sucursal y un usuario admin para poder entrar.
const bcrypt = require('bcryptjs')
const sequelize = require('./db')
const Usuario = require('./models/Usuario')
const Sucursal = require('./models/Sucursal')

const crearAdminInicial = async () => {
  const cantidad = await Usuario.count()
  if (cantidad > 0) return

  let sucursal = await Sucursal.findOne()
  if (!sucursal) {
    sucursal = await Sucursal.create({ nombre: 'Casa Central', estado: 1 })
  }

  const nombre = process.env.ADMIN_NOMBRE || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  await Usuario.create({
    nombre,
    apellido: 'Administrador',
    tipoUsuario: 'admin',
    password: await bcrypt.hash(password, 10),
    idSucursal: sucursal.idSucursal
  })
  console.log(`Usuario inicial creado: ${nombre}`)
}

const inicializarBase = async () => {
  await sequelize.sync()
  await crearAdminInicial()
}

module.exports = { inicializarBase }
