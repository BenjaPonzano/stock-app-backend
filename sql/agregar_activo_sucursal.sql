-- Borrado lógico de sucursales (lo aplica solo src/migraciones.js al arrancar).
ALTER TABLE sucursal ADD COLUMN activo TINYINT NOT NULL DEFAULT 1;
