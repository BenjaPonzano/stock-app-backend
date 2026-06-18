const request = require('supertest')
const app = require('../app')
const sequelize = require('../db')

beforeAll(async () => {
  await sequelize.authenticate()
})

afterAll(async () => {
  await sequelize.close()
})

describe('CRUD Producto', () => {

  test('GET /api/productos - debe retornar lista de productos', async () => {
    const res = await request(app).get('/api/productos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('GET /api/productos - cada producto debe tener nombre y stock', async () => {
    const res = await request(app).get('/api/productos')
    expect(res.status).toBe(200)
    res.body.forEach(p => {
      expect(p).toHaveProperty('nombre')
      expect(p).toHaveProperty('stock')
    })
  })

})