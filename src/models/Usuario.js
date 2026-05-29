const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Usuario = sequelize.define('Usuario', {
  idUsuario:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:      { type: DataTypes.STRING(100), allowNull: false },
  apellido:    { type: DataTypes.STRING(100), allowNull: false },
  tipoUsuario: { type: DataTypes.STRING(20), allowNull: false },
  password:    { type: DataTypes.STRING(255), allowNull: false },
  idSucursal:  { type: DataTypes.INTEGER }
}, { tableName: 'usuario', timestamps: false })

module.exports = Usuario
