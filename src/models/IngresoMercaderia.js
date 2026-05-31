const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const IngresoMercaderia = sequelize.define('IngresoMercaderia', {
  idIngreso:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proveedor:  { type: DataTypes.STRING(100), allowNull: false },
  factura:    { type: DataTypes.STRING(50) },
  obs:        { type: DataTypes.STRING(255) },
  fecha:      { type: DataTypes.DATEONLY, allowNull: false },
  idSucursal: { type: DataTypes.INTEGER },
  idUsuario:  { type: DataTypes.INTEGER }
}, { tableName: 'ingreso_mercaderia', timestamps: false })

module.exports = IngresoMercaderia
