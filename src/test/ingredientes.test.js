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

describe('CRUD Ingrediente', () => {

  test('GET /api/ingredientes - debe retornar lista de ingredientes', async () => {
    const res = await request(app)
      .get('/api/ingredientes')
      .set('Authorization', 'Bearer ' + token)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('GET /api/ingredientes - cada ingrediente debe tener nombre, stock y unidad', async () => {
    const res = await request(app)
      .get('/api/ingredientes')
      .set('Authorization', 'Bearer ' + token)
    expect(res.status).toBe(200)
    res.body.forEach(i => {
      expect(i).toHaveProperty('nombre')
      expect(i).toHaveProperty('stock')
      expect(i).toHaveProperty('unidad')
    })
  })

})