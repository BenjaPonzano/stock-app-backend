const request = require('supertest')
const app = require('../app')
const sequelize = require('../db')

let token

beforeAll(async () => {
  await sequelize.authenticate()
  const res = await request(app)
    .post('/api/auth/login')
    .send({ nombre: 'Admin', password: '1234' })
  token = res.body.token
})

afterAll(async () => {
  await sequelize.close()
})

describe('CRUD Producto', () => {

  test('GET /api/productos - debe retornar lista de productos', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', 'Bearer ' + token)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('GET /api/productos - cada producto debe tener nombre y stock', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', 'Bearer ' + token)
    expect(res.status).toBe(200)
    res.body.forEach(p => {
      expect(p).toHaveProperty('nombre')
      expect(p).toHaveProperty('stock')
    })
  })

})