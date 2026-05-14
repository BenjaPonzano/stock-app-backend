const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Stock funcionando!' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})