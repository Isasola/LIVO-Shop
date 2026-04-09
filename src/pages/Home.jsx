import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

function AnimatedGradient() {
  const ref = useRef(null)
  useEffect(() => {
    let frame, w = 125, dir = 1
    const animate = () => {
      w += dir * 0.012
      if (w > 132) dir = -1
      if (w < 118) dir = 1
      if (ref.current) ref.current.style.background =
        `radial-gradient(${w}% ${w}% at 50% 20%,
          #0F0F0F 28%, #3D1500 48%, #7A2E00 60%, #1a1a1a 74%, #0F0F0F 100%)`
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <div ref={ref} style={{ position:'absolute', inset:0 }} />
}

const TICKER_TEXT = 'BELLEZA · HOGAR · ELECTRÓNICA · CUIDADO PERSONAL · ACCESORIOS · ENVÍO PARAGUAY · '

export default function Home() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoria, setCategoria] = useState('Todos')

  useEffect(() => {
    supabase.from('productos').select('*').eq('activo', true).order('creado_en', { ascending: false })
      .then(({ data }) => { setProductos(data || []); setLoading(false) })
  }, [])

  const cats = ['Todos', ...new Set(productos.map(p => p.categoria).filter(Boolean))]
  const filtrados = categoria === 'Todos' ? productos : productos.filter(p => p.categoria === categoria)

  return (
    <main>

      {/* ══ HERO ══ */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <AnimatedGradient />

        {/* grain */}
        <div style={{
          position:'absolute', inset:0, zIndex:1, opacity:0.05,
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          pointerEvents:'none',
        }}/>

        {/* content — split layout */}
        <div style={{ position:'relative', zIndex:2, flex:1, display:'flex', alignItems:'center' }}>
          <div className="container" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', padding:'100px 24px 60px' }}>

            {/* LEFT — text */}
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,120,10,0.12)', border:'1px solid rgba(232,120,10,0.25)', borderRadius:40, padding:'6px 16px', marginBottom:32 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#E8780A', display:'inline-block' }}/>
                <span style={{ fontFamily:'Instrument Sans, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'#E8780A' }}>Ventas Online · Paraguay</span>
              </div>

              <h1 style={{
                fontFamily:'Unbounded, sans-serif',
                fontSize:'clamp(36px, 5vw, 64px)',
                fontWeight:900,
                letterSpacing:'-2px',
                lineHeight:1.0,
                color:'white',
                marginBottom:24,
              }}>
                Tu tienda<br />
                <span style={{ color:'#E8780A' }}>inteligente</span><br />
                en Paraguay
              </h1>

              <p style={{
                fontFamily:'Instrument Sans, sans-serif',
                fontSize:16, color:'rgba(255,255,255,0.45)',
                lineHeight:1.8, marginBottom:40, maxWidth:420,
              }}>
                Electrónica, belleza, hogar y más. Encontrás todo en un solo lugar y lo pedís directo por WhatsApp.
              </p>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <a href="#catalogo" style={{
                  background:'#E8780A', color:'white',
                  padding:'14px 32px', borderRadius:4,
                  fontFamily:'Unbounded, sans-serif',
                  fontSize:11, fontWeight:700, letterSpacing:'0.1em',
                  textTransform:'uppercase', textDecoration:'none',
                  boxShadow:'0 0 40px rgba(232,120,10,0.3)',
                }}>Ver catálogo</a>
                <a href="https://wa.me/595991273055" target="_blank" rel="noreferrer" style={{
                  background:'transparent', color:'rgba(255,255,255,0.6)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  padding:'14px 32px', borderRadius:4,
                  fontFamily:'Unbounded, sans-serif',
                  fontSize:11, fontWeight:500, letterSpacing:'0.1em',
                  textTransform:'uppercase', textDecoration:'none',
                }}>Consultar →</a>
              </div>

              {/* trust badges */}
              <div style={{ display:'flex', gap:24, marginTop:48, flexWrap:'wrap' }}>
                {[
                  { icon:'🚚', text:'Envío a todo Paraguay' },
                  { icon:'💬', text:'Atención por WhatsApp' },
                  { icon:'✅', text:'Productos garantizados' },
                ].map((b,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>{b.icon}</span>
                    <span style={{ fontFamily:'Instrument Sans, sans-serif', fontSize:12, color:'rgba(255,255,255,0.35)', letterSpacing:'0.03em' }}>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — logo */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ filter:'drop-shadow(0 0 80px rgba(232,120,10,0.35))', textAlign:'center' }}>
                <img
                  src="/logo.png"
                  alt="LIVOshop"
                  style={{ width:'clamp(200px, 28vw, 340px)', height:'auto' }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* scroll hint */}
        <div style={{ position:'relative', zIndex:2, display:'flex', justifyContent:'center', paddingBottom:32, alignItems:'center', gap:10 }}>
          <div style={{ width:1, height:40, background:'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15))' }}/>
          <span style={{ fontFamily:'Instrument Sans, sans-serif', fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>Scroll</span>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <div style={{ background:'#E8780A', overflow:'hidden', padding:'13px 0' }}>
        <div style={{ display:'flex', animation:'ticker 22s linear infinite', whiteSpace:'nowrap' }}>
          {Array(8).fill(TICKER_TEXT).map((t,i) => (
            <span key={i} style={{ fontFamily:'Unbounded, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'white', padding:'0 12px' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section style={{ background:'#0F0F0F', padding:'80px 0' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:2 }}>
            {[
              { icon:'⚡', title:'Entrega rápida', desc:'Coordinamos el envío a tu puerta en todo el país.' },
              { icon:'💎', title:'Calidad garantizada', desc:'Solo vendemos productos que nosotros mismos elegiríamos.' },
              { icon:'💬', title:'Soporte real', desc:'Respondemos por WhatsApp, sin bots ni formularios.' },
              { icon:'🔄', title:'Variedad constante', desc:'Siempre sumando productos nuevos al catálogo.' },
            ].map((f, i) => (
              <div key={i} style={{
                padding:'40px 32px',
                border:'1px solid #1C1C1C',
                transition:'border-color 0.2s',
              }}>
                <div style={{ fontSize:28, marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontFamily:'Unbounded, sans-serif', fontSize:13, fontWeight:700, color:'white', marginBottom:10, letterSpacing:'-0.3px' }}>{f.title}</h3>
                <p style={{ fontSize:13, color:'#555', lineHeight:1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATÁLOGO ══ */}
      <section id="catalogo" style={{ padding:'100px 0 120px', background:'#F8F6F3' }}>
        <div className="container">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:56, flexWrap:'wrap', gap:24 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:32, height:1, background:'#E8780A' }} />
                <span style={{ fontFamily:'Instrument Sans, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'#E8780A' }}>Catálogo</span>
              </div>
              <h2 style={{ fontFamily:'Unbounded, sans-serif', fontSize:'clamp(32px,6vw,52px)', fontWeight:900, color:'#0F0F0F', letterSpacing:'-2px', lineHeight:0.95 }}>
                Nuestros<br /><span style={{ color:'#E8780A' }}>productos</span>
              </h2>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCategoria(c)} style={{
                  background: categoria === c ? '#0F0F0F' : 'white',
                  color: categoria === c ? 'white' : '#888',
                  border:`1px solid ${categoria === c ? '#0F0F0F' : '#DDD'}`,
                  borderRadius:3, padding:'9px 20px',
                  fontFamily:'Instrument Sans, sans-serif',
                  fontSize:12, fontWeight:500, cursor:'pointer',
                  transition:'all 0.15s',
                }}>{c}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {[1,2,3].map(i => <div key={i} style={{ background:'#EEE', borderRadius:6, height:400, animation:'pulse 1.4s ease-in-out infinite' }} />)}
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'120px 0' }}>
              <p style={{ fontFamily:'Unbounded, sans-serif', fontSize:18, fontWeight:700, color:'#0F0F0F', marginBottom:12 }}>Productos próximamente</p>
              <p style={{ fontSize:14, color:'#888', marginBottom:32 }}>Escribinos para consultar disponibilidad</p>
              <a href="https://wa.me/595991273055" target="_blank" rel="noreferrer" style={{
                background:'#0F0F0F', color:'white', padding:'13px 28px',
                borderRadius:4, fontFamily:'Instrument Sans, sans-serif',
                fontSize:13, fontWeight:600, textDecoration:'none',
              }}>Consultar por WhatsApp</a>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {filtrados.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section style={{ background:'#0F0F0F', padding:'100px 0', position:'relative', overflow:'hidden' }}>
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:600, height:600, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(232,120,10,0.07) 0%, transparent 65%)',
          pointerEvents:'none',
        }}/>
        <div className="container" style={{ position:'relative', textAlign:'center' }}>
          <p style={{ fontFamily:'Instrument Sans, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'#E8780A', marginBottom:20 }}>¿No encontraste lo que buscás?</p>
          <h2 style={{ fontFamily:'Unbounded, sans-serif', fontSize:'clamp(28px,5vw,52px)', fontWeight:900, color:'white', letterSpacing:'-2px', lineHeight:1, marginBottom:40 }}>
            Conseguimos<br />lo que necesitás
          </h2>
          <a href="https://wa.me/595991273055?text=Hola LIVOshop!" target="_blank" rel="noreferrer" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            background:'#E8780A', color:'white',
            padding:'16px 40px', borderRadius:4,
            fontFamily:'Unbounded, sans-serif',
            fontSize:11, fontWeight:700, letterSpacing:'0.1em',
            textTransform:'uppercase', textDecoration:'none',
            boxShadow:'0 0 60px rgba(232,120,10,0.2)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Escribir por WhatsApp
          </a>
        </div>
      </section>

      <style>{`
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
