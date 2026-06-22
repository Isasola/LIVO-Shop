import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { trackCarrito } from '../lib/tracking'

export default function ProductCard({ product }) {
  const { add } = useCart()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)
  const img = product.imagenes?.[0]
  const hasPrice = product.precio_gs && product.precio_gs > 0

  return (
    <div
      onClick={() => navigate(`/producto/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'white', cursor:'pointer',
        border:`1px solid ${hovered ? '#0F0F0F' : '#E8E4DE'}`,
        borderRadius:6, overflow:'hidden',
        transition:'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{ position:'relative', aspectRatio:'1', background:'#F8F6F3', overflow:'hidden' }}>
        {img
          ? <img src={img} alt={product.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>📦</div>
        }
        {product.destacado && (
          <div style={{ position:'absolute', top:12, left:12, background:'#E8780A', color:'white', fontSize:9, fontWeight:700, letterSpacing:'0.12em', padding:'5px 12px', borderRadius:2, textTransform:'uppercase' }}>
            Destacado
          </div>
        )}
        {product.tipo === 'dropshipping' && (
          <div style={{ position:'absolute', top:12, right:12, background:'rgba(15,15,15,0.75)', backdropFilter:'blur(8px)', color:'white', fontSize:9, fontWeight:600, letterSpacing:'0.08em', padding:'5px 12px', borderRadius:2 }}>
            Dropi
          </div>
        )}
      </div>

      <div style={{ padding:'16px 18px 18px' }}>
        {product.categoria && (
          <p style={{ fontFamily:'Satoshi, sans-serif', fontSize:10, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'#E8780A', marginBottom:6 }}>{product.categoria}</p>
        )}
        <h3 style={{ fontFamily:'Clash Display, sans-serif', fontSize:12, fontWeight:700, lineHeight:1.45, letterSpacing:'-0.3px', color:'#0F0F0F', marginBottom:14 }}>
          {product.nombre}
        </h3>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          {hasPrice
            ? <p style={{ fontFamily:'Clash Display, sans-serif', fontSize:16, fontWeight:900, color:'#0F0F0F', letterSpacing:'-0.5px' }}>Gs. {product.precio_gs.toLocaleString('es-PY')}</p>
            : <p style={{ fontSize:12, color:'#999', fontFamily:'Satoshi, sans-serif' }}>Consultar precio</p>
          }
          <button
            onClick={e => { e.stopPropagation(); add(product); trackCarrito(product.id) }}
            style={{
              background: added ? '#16A34A' : '#0F0F0F',
              color:'white', border:'none', borderRadius:4,
              padding:'9px 16px', fontSize:11, fontWeight:700,
              fontFamily:'Satoshi, sans-serif',
              cursor:'pointer', transition:'background 0.2s',
              letterSpacing:'0.05em',
            }}
          >
            {added ? '✓' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
