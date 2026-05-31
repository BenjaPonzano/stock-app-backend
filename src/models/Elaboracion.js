const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Elaboracion = sequelize.define('Elaboracion', {
  idElaboracion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idReceta:      { type: DataTypes.INTEGER },
  recetaNombre:  { type: DataTypes.STRING(100) },
  idProducto:    { type: DataTypes.INTEGER },
  idUsuario:     { type: DataTypes.INTEGER },
  idSucursal:    { type: DataTypes.INTEGER },
  cantidad:      { type: DataTypes.INTEGER, allowNull: false },
  obs:           { type: DataTypes.STRING(255) },
  fecha:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'elaboracion', timestamps: false })

const DetalleElaboracion = sequelize.define('DetalleElaboracion', {
  idElaboracion:  { type: DataTypes.INTEGER, primaryKey: true },
  idIngrediente:  { type: DataTypes.INTEGER, primaryKey: true },
  cant:           { type: DataTypes.DOUBLE, allowNull: false },
  precioUnitario: { type: DataTypes.DOUBLE }
}, { tableName: 'detalle_ingrediente', timestamps: false })

Elaboracion.hasMany(DetalleElaboracion, { foreignKey: 'idElaboracion', as: 'ingredientes' })
DetalleElaboracion.belongsTo(Elaboracion, { foreignKey: 'idElaboracion' })

module.exports = { Elaboracion, DetalleElaboracion }
