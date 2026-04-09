import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  const add = (product, variante = null) => {
    setItems(prev => {
      const key = `${product.id}-${variante}`
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { key, product, variante, qty: 1 }]
    })
    setOpen(true)
  }

  const remove = (key) => setItems(prev => prev.filter(i => i.key !== key))

  const updateQty = (key, qty) => {
    if (qty < 1) return remove(key)
    setItems(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + (i.product.precio_gs || 0) * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  const sendWhatsApp = () => {
    const num = '595991273055'
    const lines = items.map(i => {
      const v = i.variante ? ` (${i.variante})` : ''
      const precio = i.product.precio_gs
        ? ` — Gs. ${i.product.precio_gs.toLocaleString('es-PY')}`
        : ''
      return `• ${i.product.nombre}${v} x${i.qty}${precio}`
    })
    const msg = `Hola LIVOshop! Me interesa hacer este pedido:\n\n${lines.join('\n')}\n\nTotal: Gs. ${total.toLocaleString('es-PY')}\n\n¿Disponible?`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, total, count, open, setOpen, sendWhatsApp }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
