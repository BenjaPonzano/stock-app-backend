const dotenv = require('dotenv')
dotenv.config()

const sequelize = require('./db')
const app = require('./app')
const { aplicarMigraciones } = require('./migraciones')

const PORT = process.env.PORT || 3001

sequelize.authenticate()
  .then(async () => {
    console.log('Conectado a MySQL')
    await aplicarMigraciones()
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  })
  .catch(err => {
    console.error('Error al conectar a MySQL:', err.message)
  })