// MercadoLibre Paraguay — site ID: MPY
// Note: ML public API works from browsers (CORS allowed) but blocks server-side requests.
// We use keyword-based search instead of category IDs because MPY category IDs are
// undocumented and unstable — keyword search is always reliable.
const ML_SITE = 'MPY'
const ML_BASE = 'https://api.mercadolibre.com'

// Keywords that represent each store category in Paraguay's market
export const CATEGORY_KEYWORDS = {
  Belleza:     'maquillaje belleza cuidado piel',
  Higiene:     'higiene personal cuidado cuerpo',
  Cabello:     'plancha cabello shampoo pelo',
  Electrónica: 'auriculares celular electronica',
  Hogar:       'hogar cocina decoracion casa',
  Deporte:     'deporte fitness gym ejercicio',
  Otro:        'accesorios varios',
}

export const CATEGORIAS = Object.keys(CATEGORY_KEYWORDS)

async function fetchML(path) {
  const res = await fetch(`${ML_BASE}${path}`)
  if (!res.ok) throw new Error(`ML ${res.status}`)
  return res.json()
}

function mapItem(item) {
  return {
    id: item.id,
    titulo: item.title,
    precio: item.price,
    moneda: item.currency_id,
    // sold_quantity is not always present in basic search — default to 0
    vendidos: item.sold_quantity || 0,
    imagen: item.thumbnail?.replace('http://', 'https://') ?? null,
    url: item.permalink,
  }
}

export async function getTopSellersByCategory(categoria) {
  const keyword = CATEGORY_KEYWORDS[categoria]
  if (!keyword) return []
  try {
    // Use the first word of the keyword string as the main query — more results
    const q = keyword.split(' ')[0]
    const data = await fetchML(
      `/sites/${ML_SITE}/search?q=${encodeURIComponent(q)}&sort=sold_quantity_desc&limit=10`
    )
    return (data.results || []).map(mapItem)
  } catch {
    return []
  }
}

export async function searchProducts(query) {
  if (!query?.trim()) return []
  try {
    const data = await fetchML(
      `/sites/${ML_SITE}/search?q=${encodeURIComponent(query.trim())}&sort=sold_quantity_desc&limit=12`
    )
    return (data.results || []).map(mapItem)
  } catch {
    return []
  }
}

export async function getAllTrends() {
  try {
    const data = await fetchML(`/trends/${ML_SITE}`)
    // data is an array of {keyword, url}
    return (Array.isArray(data) ? data : []).slice(0, 12).map(item => ({
      keyword: item.keyword,
      url: item.url,
    }))
  } catch {
    return []
  }
}
