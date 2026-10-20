const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    // Las bases en la nube (ej. Aiven) piden conexión cifrada: poner DB_SSL=true en el .env
    dialectOptions: process.env.DB_SSL === 'true'
      ? { ssl: { rejectUnauthorized: false } }
      : {}
  }
)

module.exports = sequelize
