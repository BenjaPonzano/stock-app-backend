const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Venta = sequelize.define('Venta', {
  idCompra:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idUsuario:  { type: DataTypes.INTEGER },
  idSucursal: { type: DataTypes.INTEGER },
  total:      { type: DataTypes.DOUBLE, defaultValue: 0 },
  descuento:  { type: DataTypes.DOUBLE, defaultValue: 0 },
  tipoPago:   { type: DataTypes.STRING(20) },
  fecha:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  forzada:    { type: DataTypes.TINYINT, defaultValue: 0 }
}, { tableName: 'compra', timestamps: false })

const DetalleVenta = sequelize.define('DetalleVenta', {
  idCompra:       { type: DataTypes.INTEGER, primaryKey: true },
  idProducto:     { type: DataTypes.INTEGER, primaryKey: true },
  cant:           { type: DataTypes.INTEGER, allowNull: false },
  precioUnitario: { type: DataTypes.DOUBLE, allowNull: false }
}, { tableName: 'detalle_compra', timestamps: false })

Venta.hasMany(DetalleVenta, { foreignKey: 'idCompra', as: 'items' })
DetalleVenta.belongsTo(Venta, { foreignKey: 'idCompra' })

module.exports = { Venta, DetalleVenta }
