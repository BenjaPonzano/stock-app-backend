// Unidades de medida y conversión entre unidades de la misma familia.
// Peso: g, kg · Volumen: ml, l · Unidades sueltas: u
// El stock y las compras de un ingrediente se llevan en SU unidad (por ejemplo kg);
// las recetas pueden usar cualquier unidad compatible (por ejemplo g).

const FAMILIAS = {
  g:  { base: 'g',  factor: 1 },
  kg: { base: 'g',  factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  l:  { base: 'ml', factor: 1000 },
  u:  { base: 'u',  factor: 1 }
}

const UNIDADES = Object.keys(FAMILIAS)

const esUnidad = (u) => Object.prototype.hasOwnProperty.call(FAMILIAS, u)

const sonCompatibles = (a, b) => esUnidad(a) && esUnidad(b) && FAMILIAS[a].base === FAMILIAS[b].base

// Unidades en las que se puede expresar algo medido en "unidad" (incluida ella misma).
const compatibles = (unidad) => (esUnidad(unidad) ? UNIDADES.filter(u => sonCompatibles(u, unidad)) : [])

// Redondea para evitar errores de coma flotante (0.1 + 0.2).
const redondear = (n, decimales = 3) => {
  const m = 10 ** decimales
  return Math.round((Number(n) + Number.EPSILON) * m) / m
}

// Convierte una cantidad de una unidad a otra. Si falta alguna unidad, no convierte.
const convertir = (cant, desde, hacia) => {
  if (!desde || !hacia || desde === hacia) return Number(cant)
  if (!sonCompatibles(desde, hacia)) {
    throw Object.assign(new Error(`La unidad "${desde}" no es compatible con "${hacia}"`), { status: 400 })
  }
  return redondear(Number(cant) * FAMILIAS[desde].factor / FAMILIAS[hacia].factor, 6)
}

module.exports = { UNIDADES, esUnidad, sonCompatibles, compatibles, convertir, redondear }
