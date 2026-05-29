const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Sucursal = sequelize.define('Sucursal', {
  idSucursal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:     { type: DataTypes.STRING(100), allowNull: false },
  direccion:  { type: DataTypes.STRING(200) },
  telefono:   { type: DataTypes.STRING(20) },
  encargado:  { type: DataTypes.STRING(100) },
  estado:     { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'sucursal', timestamps: false })

module.exports = Sucursal
