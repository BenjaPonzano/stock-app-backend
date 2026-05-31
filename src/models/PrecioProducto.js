const { DataTypes } = require('sequelize')
const sequelize = require('../db')
const Producto = require('./Producto')

const PrecioProducto = sequelize.define('PrecioProducto', {
  idProducto:   { type: DataTypes.INTEGER, primaryKey: true },
  fecha_desde:  { type: DataTypes.DATEONLY, primaryKey: true },
  precio:       { type: DataTypes.DOUBLE, allowNull: false },
  precioCompra: { type: DataTypes.DOUBLE }
}, { tableName: 'precio_producto', timestamps: false })

Producto.hasMany(PrecioProducto, { foreignKey: 'idProducto', as: 'precios' })
PrecioProducto.belongsTo(Producto, { foreignKey: 'idProducto' })

module.exports = PrecioProducto
