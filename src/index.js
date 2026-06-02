const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const sequelize = require('./db')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/sucursales',    require('./routes/sucursales'))
app.use('/api/usuarios',      require('./routes/usuarios'))
app.use('/api/productos',     require('./routes/productos'))
app.use('/api/ingredientes',  require('./routes/ingredientes'))
app.use('/api/ventas',        require('./routes/ventas'))
app.use('/api/compras',       require('./routes/compras'))
app.use('/api/elaboraciones', require('./routes/elaboraciones'))
app.use('/api/recetas',       require('./routes/recetas'))
app.use('/api/auth',         require('./routes/auth'))

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Stock funcionando!' })
})

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
