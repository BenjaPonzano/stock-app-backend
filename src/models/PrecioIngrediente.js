const { DataTypes } = require('sequelize')
const sequelize = require('../db')
const Ingrediente = require('./Ingrediente')

const PrecioIngrediente = sequelize.define('PrecioIngrediente', {
  idIngrediente: { type: DataTypes.INTEGER, primaryKey: true },
  fecha_desde:   { type: DataTypes.DATEONLY, primaryKey: true },
  precio:        { type: DataTypes.DOUBLE, allowNull: false }
}, { tableName: 'precio_ingrediente', timestamps: false })

Ingrediente.hasMany(PrecioIngrediente, { foreignKey: 'idIngrediente', as: 'precios' })
PrecioIngrediente.belongsTo(Ingrediente, { foreignKey: 'idIngrediente' })

module.exports = PrecioIngrediente
