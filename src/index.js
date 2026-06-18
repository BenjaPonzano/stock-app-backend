const dotenv = require('dotenv')
dotenv.config()

const sequelize = require('./db')
const app = require('./app')

const PORT = process.env.PORT || 3001

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL')
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  })
  .catch(err => {
    console.error('Error al conectar a MySQL:', err.message)
  })