const request = require('supertest')
const app = require('../app')
const sequelize = require('../db')

beforeAll(async () => {
  await sequelize.authenticate()
})

afterAll(async () => {
  await sequelize.close()
})

describe('CRUD Ingrediente', () => {

  test('GET /api/ingredientes - debe retornar lista de ingredientes', async () => {
    const res = await request(app).get('/api/ingredientes')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('GET /api/ingredientes - cada ingrediente debe tener nombre, stock y unidad', async () => {
    const res = await request(app).get('/api/ingredientes')
    expect(res.status).toBe(200)
    res.body.forEach(i => {
      expect(i).toHaveProperty('nombre')
      expect(i).toHaveProperty('stock')
      expect(i).toHaveProperty('unidad')
    })
  })

})