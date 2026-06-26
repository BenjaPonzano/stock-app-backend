const request = require('supertest')
const app = require('../app')
const sequelize = require('../db')

let token

beforeAll(async () => {
  await sequelize.authenticate()
  const res = await request(app)
    .post('/api/auth/login')
    .send({ nombre: 'admin', password: 'admin123' })
  token = res.body.token
})

afterAll(async () => {
  await sequelize.close()
})

describe('CRUD Sucursal', () => {

  test('GET /api/sucursales - debe retornar lista de sucursales', async () => {
    const res = await request(app)
      .get('/api/sucursales')
      .set('Authorization', 'Bearer ' + token)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('GET /api/sucursales - cada sucursal debe tener nombre y estado', async () => {
    const res = await request(app)
      .get('/api/sucursales')
      .set('Authorization', 'Bearer ' + token)
    expect(res.status).toBe(200)
    res.body.forEach(s => {
      expect(s).toHaveProperty('nombre')
      expect(s).toHaveProperty('activa')
    })
  })

  test('GET /api/sucursales - sin token debe retornar 401', async () => {
    const res = await request(app).get('/api/sucursales')
    expect(res.status).toBe(401)
  })

})