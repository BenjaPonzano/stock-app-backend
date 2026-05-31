const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const SumaIngrediente = sequelize.define('SumaIngrediente', {
  idSuma:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idIngreso:      { type: DataTypes.INTEGER },
  idIngrediente:  { type: DataTypes.INTEGER },
  idUsuario:      { type: DataTypes.INTEGER },
  idSucursal:     { type: DataTypes.INTEGER },
  cant:           { type: DataTypes.INTEGER, allowNull: false },
  precioUnitario: { type: DataTypes.DOUBLE },
  proveedor:      { type: DataTypes.STRING(100) },
  fecha:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'suma_ingredientes', timestamps: false })

const SumaProducto = sequelize.define('SumaProducto', {
  idSuma:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idIngreso:      { type: DataTypes.INTEGER },
  idProducto:     { type: DataTypes.INTEGER },
  idUsuario:      { type: DataTypes.INTEGER },
  idSucursal:     { type: DataTypes.INTEGER },
  cant:           { type: DataTypes.INTEGER, allowNull: false },
  precioUnitario: { type: DataTypes.DOUBLE },
  proveedor:      { type: DataTypes.STRING(100) },
  fecha:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'suma_producto', timestamps: false })

module.exports = { SumaIngrediente, SumaProducto }
