# stock-app-backend

Backend - Sistema de stock TP DSW

API REST en Express + Sequelize sobre MySQL, con autenticación por JWT.

## Requisitos

- Node.js 20+
- MySQL corriendo con la base creada (por defecto `stock_app`)

## Puesta en marcha

```bash
npm install
cp .env.example .env   # y completar los valores
npm start
```

La API queda en `http://localhost:3001`. El frontend espera ese puerto, así que
**no usar 3000**: ese lo ocupa el dev server de React.

## Variables de entorno

Están todas documentadas en `.env.example`. El `.env` real no se commitea.

| Variable | Para qué |
|---|---|
| `PORT` | Puerto de la API. Usar 3001. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL. |
| `JWT_SECRET` | Clave para firmar y validar los tokens del login. |

`JWT_SECRET` es obligatoria: si falta, el login responde 500
(`secretOrPrivateKey must have a value`) y todas las rutas protegidas responden 401.

## Tests

```bash
npm test
```

Son tests **de integración**, no unitarios: levantan la app con supertest y pegan
contra la base real. Para que pasen hace falta:

- MySQL levantado y accesible con las credenciales del `.env`
- Un usuario `admin` con contraseña `admin123` cargado en la tabla de usuarios
  (lo usa `src/test/auth.test.js`)
- Las tablas de productos, ingredientes y sucursales creadas

No hay seed automático, así que los datos se cargan a mano antes de correrlos.

## Rutas

Todas cuelgan de `/api`: `auth`, `usuarios`, `sucursales`, `productos`,
`ingredientes`, `ventas`, `compras`, `elaboraciones`, `recetas`.

El login es `POST /api/auth/login` y devuelve `{ token, tipoUsuario, nombre }`.
El token va en el header `Authorization: Bearer <token>`.

Los `GET` de productos e ingredientes son públicos; el resto de las operaciones
piden token, y las de alta/baja/modificación piden además que el usuario sea `admin`.
