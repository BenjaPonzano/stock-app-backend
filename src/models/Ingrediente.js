const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Ingrediente = sequelize.define('Ingrediente', {
  idIngrediente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:        { type: DataTypes.STRING(100), allowNull: false },
  descripcion:   { type: DataTypes.STRING(255) },
  categoria:     { type: DataTypes.STRING(50) },
  unidad:        { type: DataTypes.STRING(20) },
  stock:         { type: DataTypes.INTEGER, defaultValue: 0 },
  stockMin:      { type: DataTypes.INTEGER, defaultValue: 0 },
  emoji:         { type: DataTypes.STRING(10) }
}, { tableName: 'ingrediente', timestamps: false })

module.exports = Ingrediente
