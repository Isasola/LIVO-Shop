import { supabase } from './supabase'

// In-memory set so we don't double-count same product view per session
const viewedInSession = new Set()

export function trackVista(productoId) {
  if (!productoId || viewedInSession.has(productoId)) return
  viewedInSession.add(productoId)
  supabase.from('producto_eventos').insert({ producto_id: productoId, tipo: 'vista' }).then()
}

export function trackWhatsapp(productoId) {
  if (!productoId) return
  supabase.from('producto_eventos').insert({ producto_id: productoId, tipo: 'whatsapp' }).then()
}

export function trackCarrito(productoId) {
  if (!productoId) return
  supabase.from('producto_eventos').insert({ producto_id: productoId, tipo: 'carrito' }).then()
}
