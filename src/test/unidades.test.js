const { compatibles, sonCompatibles, convertir, redondear, esUnidad } = require('../utils/unidades')

describe('unidades', () => {
  test('reconoce las unidades válidas', () => {
    expect(esUnidad('kg')).toBe(true)
    expect(esUnidad('toString')).toBe(false)
    expect(esUnidad('libra')).toBe(false)
  })

  test('g y kg son compatibles; g y ml no', () => {
    expect(sonCompatibles('g', 'kg')).toBe(true)
    expect(sonCompatibles('ml', 'l')).toBe(true)
    expect(sonCompatibles('g', 'ml')).toBe(false)
    expect(sonCompatibles('u', 'kg')).toBe(false)
  })

  test('lista las unidades compatibles con una dada', () => {
    expect(compatibles('kg')).toEqual(['g', 'kg'])
    expect(compatibles('l')).toEqual(['ml', 'l'])
    expect(compatibles('u')).toEqual(['u'])
    expect(compatibles('xx')).toEqual([])
  })

  test('convierte gramos a kilos y al revés', () => {
    expect(convertir(300, 'g', 'kg')).toBe(0.3)
    expect(convertir(2, 'kg', 'g')).toBe(2000)
    expect(convertir(250, 'ml', 'l')).toBe(0.25)
  })

  test('misma unidad o unidad faltante no convierten', () => {
    expect(convertir(5, 'kg', 'kg')).toBe(5)
    expect(convertir(5, '', 'kg')).toBe(5)
    expect(convertir(5, 'g', undefined)).toBe(5)
  })

  test('unidades incompatibles lanzan un error 400', () => {
    expect(() => convertir(1, 'g', 'ml')).toThrow(/no es compatible/)
    try { convertir(1, 'g', 'u') } catch (e) { expect(e.status).toBe(400) }
  })

  test('redondear evita errores de coma flotante', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(redondear(0.1 + 0.2)).toBe(0.3)
    expect(redondear(10 - 0.3)).toBe(9.7)
  })
})
