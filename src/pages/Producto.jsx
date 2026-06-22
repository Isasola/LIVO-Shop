import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/CartContext'
import { trackVista, trackWhatsapp, trackCarrito } from '../lib/tracking'

export default function Producto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [variante, setVariante] = useState(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    supabase.from('productos').select('*').eq('id', id).single()
      .then(({ data }) => { setProduct(data); setLoading(false); trackVista(id) })
  }, [id])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6B6B6B' }}>Cargando...</p></div>
  if (!product) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Producto no encontrado</p></div>

  const imgs = product.imagenes || []
  const variantes = product.variantes || []
  const hasPrice = product.precio_gs && product.precio_gs > 0

  const handleAdd = () => {
    add(product, variante)
    trackCarrito(product.id)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const whatsappDirect = () => {
    trackWhatsapp(product.id)
    const v = variante ? ` — ${variante}` : ''
    const precio = hasPrice ? ` (Gs. ${product.precio_gs.toLocaleString('es-PY')})` : ''
    const msg = `Hola LIVOshop! Me interesa el producto: *${product.nombre}*${v}${precio}. ¿Está disponible?`
    window.open(`https://wa.me/595991273055?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <main style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#6B6B6B', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif' }}
        >
          ← Volver al catálogo
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'start' }}>
          {/* Images */}
          <div>
            <div style={{ background: '#F5F3EF', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1', marginBottom: '12px' }}>
              {imgs[imgIdx] ? (
                <img src={imgs[imgIdx]} alt={product.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>📦</div>
              )}
            </div>
            {imgs.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} style={{
                    width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', padding: 0,
                    border: `2px solid ${i === imgIdx ? '#E8780A' : '#E8E4DE'}`,
                    cursor: 'pointer', background: 'none',
                  }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.categoria && (
              <p style={{ fontSize: '12px', color: '#E8780A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {product.categoria}
              </p>
            )}
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px' }}>
              {product.nombre}
            </h1>

            {hasPrice ? (
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#E8780A', fontFamily: 'Syne, sans-serif', marginBottom: '24px' }}>
                Gs. {product.precio_gs.toLocaleString('es-PY')}
              </p>
            ) : (
              <p style={{ fontSize: '18px', color: '#6B6B6B', marginBottom: '24px' }}>Precio a consultar</p>
            )}

            {product.descripcion && (
              <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.8, marginBottom: '24px' }}>
                {product.descripcion}
              </p>
            )}

            {/* Variantes */}
            {variantes.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Variante: {variante || 'Elegir'}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {variantes.map(v => (
                    <button
                      key={v}
                      onClick={() => setVariante(v === variante ? null : v)}
                      style={{
                        border: `1.5px solid ${variante === v ? '#E8780A' : '#E8E4DE'}`,
                        background: variante === v ? '#FFF0E0' : 'white',
                        color: variante === v ? '#E8780A' : '#444',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 0.15s',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleAdd}
                style={{
                  background: added ? '#25D366' : '#E8780A',
                  color: 'white', border: 'none',
                  borderRadius: '12px', padding: '15px',
                  fontSize: '16px', fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
              </button>
              <button
                onClick={whatsappDirect}
                style={{
                  background: 'white', color: '#1A1A1A',
                  border: '1.5px solid #E8E4DE',
                  borderRadius: '12px', padding: '15px',
                  fontSize: '15px', fontWeight: 500,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <span style={{ color: '#25D366' }}>💬</span> Consultar por WhatsApp
              </button>
            </div>

            {/* Meta */}
            <div style={{ marginTop: '24px', padding: '16px', background: '#F5F3EF', borderRadius: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>Envío</span><br />Todo Paraguay
              </div>
              <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>Origen</span><br />
                {product.tipo === 'dropshipping' ? 'Envío directo' : 'Stock propio'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
