-- Permite decimales en el stock de ingredientes y en sus movimientos (ej.: 9,7 kg de harina).
-- Se aplica solo al iniciar el servidor (src/migraciones.js); este script es el equivalente manual.
ALTER TABLE ingrediente         MODIFY COLUMN stock    DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE ingrediente         MODIFY COLUMN stockMin DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE detalle_ingrediente MODIFY COLUMN cant     DOUBLE NOT NULL;
ALTER TABLE suma_ingredientes   MODIFY COLUMN cant     DOUBLE NOT NULL;
