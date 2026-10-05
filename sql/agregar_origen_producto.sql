-- Agrega el atributo "origen" a los productos:
--   'comprado'  -> se compra hecho (aparece en Ingreso de Mercadería)
--   'elaborado' -> se prepara en el local con una receta (aparece en Recetas)
-- El backend también lo crea solo al arrancar (src/migraciones.js), así que
-- ejecutar este script a mano es opcional. Si tira "Duplicate column name",
-- es porque ya existe: ignoralo.

ALTER TABLE producto ADD COLUMN origen VARCHAR(20) NOT NULL DEFAULT 'comprado';

-- Los productos que ya son resultado de una receta pasan a 'elaborado'.
UPDATE producto SET origen = 'elaborado'
WHERE idProducto IN (SELECT idProducto FROM receta);
