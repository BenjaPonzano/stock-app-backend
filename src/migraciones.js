// Ajustes de esquema que se aplican solos al arrancar el servidor.
// Cada uno es idempotente: si la columna ya existe, no hace nada.
// (Los mismos cambios están documentados como SQL en la carpeta /sql.)
const sequelize = require('./db')

const agregarOrigenAProducto = async () => {
  const qi = sequelize.getQueryInterface()
  const columnas = await qi.describeTable('producto')
  if (columnas.origen) return

  await sequelize.query("ALTER TABLE producto ADD COLUMN origen VARCHAR(20) NOT NULL DEFAULT 'comprado'")
  // Los productos que ya salen de una receta se marcan como elaborados.
  await sequelize.query("UPDATE producto SET origen = 'elaborado' WHERE idProducto IN (SELECT idProducto FROM receta)")
  console.log('Migración: columna producto.origen creada')
}

const agregarUnidadesAElaboracion = async () => {
  const qi = sequelize.getQueryInterface()
  const columnas = await qi.describeTable('elaboracion')
  if (columnas.unidades) return

  await sequelize.query('ALTER TABLE elaboracion ADD COLUMN unidades INT NULL')
  // Las elaboraciones anteriores sumaron al stock solo la cantidad de lotes; se conserva ese valor.
  await sequelize.query('UPDATE elaboracion SET unidades = cantidad WHERE unidades IS NULL')
  console.log('Migración: columna elaboracion.unidades creada')
}

// Permite cantidades con decimales en el stock de ingredientes (ej.: 9,7 kg de harina).
// Antes eran INT, lo que impedía descontar 300 g de un stock llevado en kg.
const permitirDecimalesEnIngredientes = async () => {
  const qi = sequelize.getQueryInterface()
  const columnas = [
    ['ingrediente', 'stock'],
    ['ingrediente', 'stockMin'],
    ['detalle_ingrediente', 'cant'],
    ['suma_ingredientes', 'cant']
  ]
  for (const [tabla, columna] of columnas) {
    const descripcion = await qi.describeTable(tabla)
    const col = descripcion[columna]
    if (!col || !/int/i.test(col.type)) continue
    const nulo = col.allowNull ? 'NULL' : 'NOT NULL'
    const defecto = col.defaultValue !== null && col.defaultValue !== undefined ? `DEFAULT ${Number(col.defaultValue)}` : ''
    await sequelize.query(`ALTER TABLE ${tabla} MODIFY COLUMN ${columna} DOUBLE ${nulo} ${defecto}`)
    console.log(`Migración: ${tabla}.${columna} ahora admite decimales`)
  }
}

const aplicarMigraciones = async () => {
  try {
    await agregarOrigenAProducto()
    await agregarUnidadesAElaboracion()
    await permitirDecimalesEnIngredientes()
  } catch (err) {
    // No frena el servidor: el script equivalente está en sql/agregar_origen_producto.sql
    console.error('No se pudo aplicar la migración automática:', err.message)
  }
}

module.exports = { aplicarMigraciones }
