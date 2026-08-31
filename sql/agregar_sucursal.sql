-- Ejecutar una sola vez en cada base local si falta la columna idSucursal.
-- Si te tira error "Duplicate column name", es porque ya la tenés: ignoralo y seguí.

ALTER TABLE producto
  ADD COLUMN idSucursal INT NULL,
  ADD CONSTRAINT fk_producto_sucursal FOREIGN KEY (idSucursal) REFERENCES sucursal(idSucursal);

ALTER TABLE ingrediente
  ADD COLUMN idSucursal INT NULL,
  ADD CONSTRAINT fk_ingrediente_sucursal FOREIGN KEY (idSucursal) REFERENCES sucursal(idSucursal);
  
ALTER TABLE producto ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE ingrediente ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;