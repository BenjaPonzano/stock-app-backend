const request = require('supertest')
const app = require('../app')
const sequelize = require('../db')

beforeAll(async () => {
  await sequelize.authenticate()
})

afterAll(async () => {
  await sequelize.close()
})

describe('Autenticación - Test de Integración', () => {

  test('POST /api/auth/login - login exitoso con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ nombre: 'Admin', password: '1234' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('tipoUsuario')
  })

  test('POST /api/auth/login - login fallido con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ nombre: 'Admin', password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  test('GET /api/productos - acceso sin token debe retornar 401', async () => {
    const res = await request(app).get('/api/productos')
    expect(res.status).toBe(401)
  })

  test('GET /api/ventas - acceso sin token debe retornar 401', async () => {
    const res = await request(app).get('/api/ventas')
    expect(res.status).toBe(401)
  })

})