# stock-app-backend

Backend del sistema **StockGastro** (TP de Desarrollo de Software): control de stock
para un local de comida con varias sucursales.

API REST en **Node.js + Express**, persistencia con **Sequelize** (ORM) sobre **MySQL**
y autenticación con **JWT**. Frontend: [stock-app-frontend](https://github.com/BenjaPonzano/stock-app-frontend).

## Requisitos

- Node.js 20 o superior
- MySQL en ejecución con una base creada (por defecto `cocina_dsw`)

## Puesta en marcha

```bash
npm install
cp .env.example .env     # y completar DB_PASSWORD y JWT_SECRET
npm start
```

La API queda en `http://localhost:3001`. El frontend espera ese puerto: **no usar 3000**,
que lo ocupa el servidor de desarrollo de React.

Al arrancar, el servidor aplica solo los ajustes de esquema pendientes
(`src/migraciones.js`; hoy: las columnas `producto.origen`, `elaboracion.unidades` y `sucursal.activo`). Los mismos cambios están como
script SQL en la carpeta `sql/` por si se prefiere ejecutarlos a mano.

## Variables de entorno (`.env`)

Están todas documentadas en `.env.example`. El `.env` real no se sube al repositorio.

| Variable | Para qué |
|---|---|
| `PORT` | Puerto de la API (3001). |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL. |
| `JWT_SECRET` | Clave para firmar y validar los tokens del login. Es obligatoria. |

## Arquitectura

```
src/
├── routes/        Define los endpoints y qué middlewares usa cada uno
├── middlewares/   auth.js (JWT y rol), validar.js / validaciones.js (entrada), errores.js
├── controllers/   Reciben el request, llaman al service y devuelven la respuesta
├── services/      Lógica de negocio y consultas (con transacciones donde hace falta)
├── models/        Modelos Sequelize que mapean las tablas
├── migraciones.js Ajustes de esquema que se aplican al arrancar
├── app.js         Configuración de Express (sin levantar el servidor)
└── index.js       Conecta a la base y levanta el servidor
```

Un pedido recorre: **route → middleware de auth → middleware de validación → controller → service → modelo**.
Cualquier error pasa por `middlewares/errores.js`, que lo convierte en una respuesta JSON.

## Autenticación y niveles de acceso

`POST /api/auth/login` recibe `{ nombre, password }` y devuelve
`{ token, tipoUsuario, nombre, idSucursal }`. El token (válido 8 horas) viaja en el header
`Authorization: Bearer <token>`.

Hay dos niveles:

- **admin**: acceso total, ve y cambia de sucursal.
- **vendedor**: queda atado a su sucursal. Puede registrar ventas y elaboraciones y consultar
  productos, ingredientes y recetas; no puede crear, editar ni borrar datos maestros ni
  registrar ingresos de mercadería.

## Endpoints

Todos cuelgan de `/api` y, salvo el login, piden token. La columna **Rol** indica quién puede usarlos.

| Recurso | Método y ruta | Rol |
|---|---|---|
| Auth | `POST /auth/login` | público |
| Sucursales | `GET /sucursales`, `GET /sucursales/:id` | todos |
| | `POST /sucursales`, `PUT /sucursales/:id`, `DELETE /sucursales/:id` | admin |
| Usuarios | `GET`, `POST`, `PUT /:id`, `DELETE /:id` en `/usuarios` | admin |
| Productos | `GET /productos?sucursal=`, `GET /productos/:id` | todos |
| | `POST /productos`, `PUT /productos/:id`, `DELETE /productos/:id` | admin |
| Ingredientes | `GET /ingredientes?sucursal=`, `GET /ingredientes/:id` | todos |
| | `POST /ingredientes`, `PUT /ingredientes/:id`, `DELETE /ingredientes/:id` | admin |
| Recetas | `GET /recetas`, `GET /recetas/:id` | todos |
| | `POST /recetas`, `PUT /recetas/:id`, `DELETE /recetas/:id` | admin |
| Ventas | `GET /ventas?sucursal=`, `GET /ventas/:id`, `POST /ventas` | todos |
| Elaboraciones | `GET /elaboraciones?sucursal=`, `POST /elaboraciones` | todos |
| Compras (ingreso de mercadería) | `GET /compras?sucursal=`, `POST /compras` | admin |

Notas:

- El parámetro `?sucursal=` solo lo respeta el admin; al vendedor siempre se le responde con su sucursal.
- Productos y ingredientes nuevos se replican con stock 0 en las demás sucursales activas.
- Un producto tiene `origen`: `comprado` (se compra hecho, entra por Ingreso de Mercadería) o
  `elaborado` (se prepara con una receta).
- `POST /elaboraciones` recibe `cantidad` en **lotes**. El servidor calcula las unidades producidas
  (`cantidad` x `cantPorLote` de la receta), las guarda en `unidades` y esas son las que suma al stock
  del producto. Los ingredientes se descuentan según lo que envía el cliente (`ingredientesConsumidos`).
- `POST /ventas` descuenta stock; si no alcanza responde `409` con el detalle y, enviando
  `forzada: true`, la registra igual marcándola como forzada.

## Validación y errores

Los datos que llegan en `POST` y `PUT` se validan antes del controller (`src/middlewares/validaciones.js`).
Las respuestas de error son siempre JSON:

| Código | Cuándo | Ejemplo de cuerpo |
|---|---|---|
| 400 | Datos inválidos o JSON mal formado | `{ "error": "Datos inválidos", "detalles": ["nombre es obligatorio"] }` |
| 401 | Falta el token o es inválido | `{ "mensaje": "Token inválido" }` |
| 403 | El rol no alcanza | `{ "mensaje": "Acceso denegado, se requiere ser admin" }` |
| 404 | El recurso o la ruta no existe | `{ "error": "Producto no encontrado" }` |
| 409 | Stock insuficiente o registro duplicado / en uso | `{ "error": "stock_insuficiente", "items": [...] }` |
| 500 | Error interno | `{ "error": "Error interno del servidor" }` |

## Tests

```bash
npm test
```

- `src/test/validar.test.js` y `src/test/errores.test.js` son **unitarios** y no necesitan base de datos.
- El resto (`auth`, `producto`, `ingredientes`, `sucursal`) son **de integración**: levantan la app
  con supertest y consultan la base real. Para que pasen hace falta MySQL levantado y un usuario
  `Admin` con contraseña `1234` cargado en la tabla `usuario`.
