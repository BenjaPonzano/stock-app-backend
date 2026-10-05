-- Guarda cuántas unidades se produjeron en cada elaboración (lotes x cantPorLote de la receta).
-- Se aplica solo al iniciar el servidor (src/migraciones.js); este script es el equivalente manual.
ALTER TABLE elaboracion ADD COLUMN unidades INT NULL;
UPDATE elaboracion SET unidades = cantidad WHERE unidades IS NULL;
