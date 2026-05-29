const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Receta = sequelize.define('Receta', {
  idReceta:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:      { type: DataTypes.STRING(100), allowNull: false },
  descripcion: { type: DataTypes.STRING(255) },
  idProducto:  { type: DataTypes.INTEGER },
  cantPorLote: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'receta', timestamps: false })

const DetalleReceta = sequelize.define('DetalleReceta', {
  idReceta:      { type: DataTypes.INTEGER, primaryKey: true },
  idIngrediente: { type: DataTypes.INTEGER, primaryKey: true },
  cant:          { type: DataTypes.DOUBLE, allowNull: false },
  unidad:        { type: DataTypes.STRING(20) }
}, { tableName: 'detalle_receta', timestamps: false })

Receta.hasMany(DetalleReceta, { foreignKey: 'idReceta', as: 'ingredientes' })
DetalleReceta.belongsTo(Receta, { foreignKey: 'idReceta' })

module.exports = { Receta, DetalleReceta }
