import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { getAllTrends, getTopSellersByCategory, searchProducts, CATEGORIAS } from '../lib/mlapi'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function fmtGs(n) {
  if (!n) return '—'
  return 'Gs. ' + Math.round(n).toLocaleString('es-PY')
}

// MercadoLibre prices come in PYG or sometimes BRL/USD — keep a note for user
function priceNote(moneda) {
  if (moneda === 'PYG') return null
  return `(${moneda})`
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#E8780A' }) {
  return (
    <div style={{
      background: 'white', border: '1.5px solid #E8E4DE',
      borderRadius: 12, padding: '20px 24px',
    }}>
      <p style={{ fontSize: 12, color: '#888', fontFamily: 'Instrument Sans, sans-serif', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ children, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 28, height: 2, background: '#E8780A', borderRadius: 1 }} />
      <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: '#0F0F0F' }}>{children}</h2>
      {badge && <span style={{ fontSize: 10, background: '#FFF0E0', color: '#E8780A', padding: '3px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.05em' }}>{badge}</span>}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? '#0F0F0F' : 'white',
      color: active ? 'white' : '#888',
      border: `1px solid ${active ? '#0F0F0F' : '#DDD'}`,
      borderRadius: 4, padding: '7px 16px',
      fontFamily: 'Instrument Sans, sans-serif',
      fontSize: 12, fontWeight: 500, cursor: 'pointer',
      transition: 'all 0.15s',
    }}>{label}</button>
  )
}

function Skeleton({ h = 80 }) {
  return <div style={{ background: '#F0EDEA', borderRadius: 8, height: h, animation: 'pulse 1.4s ease-in-out infinite' }} />
}

function TrendKeyword({ keyword, url, rank }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', background: 'white',
      border: '1.5px solid #E8E4DE', borderRadius: 8,
      textDecoration: 'none', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#0F0F0F'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E4DE'}
    >
      <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 10, fontWeight: 900, color: '#DDD', minWidth: 20 }}>#{rank}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F0F0F', flex: 1 }}>{keyword}</span>
      <span style={{ fontSize: 10, color: '#BBB' }}>→ ML</span>
    </a>
  )
}

function MLProductRow({ item, rank }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 14px', background: 'white',
      border: '1.5px solid #E8E4DE', borderRadius: 8,
      textDecoration: 'none', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#0F0F0F'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E4DE'}
    >
      <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 10, fontWeight: 900, color: '#DDD', minWidth: 20 }}>{rank}</span>
      {item.imagen && <img src={item.imagen} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#F0EDEA' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F0F0F', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</p>
        <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
          {fmtGs(item.precio)} {priceNote(item.moneda) && <span style={{ color: '#BBB' }}>{priceNote(item.moneda)}</span>}
          {item.vendidos > 0 && <span style={{ marginLeft: 10, color: '#25A244', fontWeight: 600 }}>{fmt(item.vendidos)} vendidos</span>}
        </p>
      </div>
    </a>
  )
}

function EventosBadge({ count, label, color }) {
  return (
    <div style={{ background: color + '18', borderRadius: 6, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontWeight: 800, fontSize: 14, fontFamily: 'Unbounded, sans-serif', color }}>{count}</span>
      <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────────

export default function Radar() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  // ── internal analytics from Supabase ──
  const [statsGlobales, setStatsGlobales] = useState(null)
  const [topProductos, setTopProductos] = useState([])
  const [productosMap, setProductosMap] = useState({}) // id -> nombre

  // ── ML data ──
  const [topSellers, setTopSellers] = useState([])
  const [trendsGlobal, setTrendsGlobal] = useState([])
  const [catSeleccionada, setCatSeleccionada] = useState('Belleza')

  // ── search ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // ── loading states ──
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingML, setLoadingML] = useState(false)
  const [loadingTrendsGlobal, setLoadingTrendsGlobal] = useState(true)

  // ── period filter ──
  const [periodo, setPeriodo] = useState(7) // days

  // ─────────────────────────────────────────────────────────────────────────────
  // Load internal analytics
  // ─────────────────────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    const desde = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: eventos }, { data: productos }] = await Promise.all([
      supabase
        .from('producto_eventos')
        .select('producto_id, tipo')
        .gte('creado_en', desde),
      supabase.from('productos').select('id, nombre, categoria, precio_gs, activo'),
    ])

    if (!eventos) { setLoadingStats(false); return }

    // build product name map
    const pMap = {}
    ;(productos || []).forEach(p => { pMap[p.id] = p })
    setProductosMap(pMap)

    const total = eventos.length
    const vistas = eventos.filter(e => e.tipo === 'vista').length
    const whatsapps = eventos.filter(e => e.tipo === 'whatsapp').length
    const carritos = eventos.filter(e => e.tipo === 'carrito').length

    // group by producto_id
    const byProducto = {}
    eventos.forEach(e => {
      if (!byProducto[e.producto_id]) byProducto[e.producto_id] = { vista: 0, whatsapp: 0, carrito: 0 }
      byProducto[e.producto_id][e.tipo] = (byProducto[e.producto_id][e.tipo] || 0) + 1
    })

    // score: carrito*4 + whatsapp*2 + vista*1
    const ranked = Object.entries(byProducto)
      .map(([id, counts]) => ({
        id,
        nombre: pMap[id]?.nombre || 'Producto borrado',
        categoria: pMap[id]?.categoria,
        precio_gs: pMap[id]?.precio_gs,
        activo: pMap[id]?.activo,
        ...counts,
        score: (counts.carrito || 0) * 4 + (counts.whatsapp || 0) * 2 + (counts.vista || 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    setStatsGlobales({ total, vistas, whatsapps, carritos })
    setTopProductos(ranked)
    setLoadingStats(false)
  }, [periodo])

  // ─────────────────────────────────────────────────────────────────────────────
  // Load ML global trends (once)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    getAllTrends().then(d => { setTrendsGlobal(d); setLoadingTrendsGlobal(false) })
  }, [user])

  // Load internal stats whenever period changes
  useEffect(() => {
    if (user) loadStats()
  }, [user, loadStats])

  // ─────────────────────────────────────────────────────────────────────────────
  // Load ML data for selected category
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setLoadingML(true)
    setTopSellers([])
    getTopSellersByCategory(catSeleccionada).then(sellers => {
      setTopSellers(sellers)
      setLoadingML(false)
    })
  }, [catSeleccionada, user])

  // ─────────────────────────────────────────────────────────────────────────────
  // ML Search
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    const results = await searchProducts(q)
    setSearchResults(results)
    setSearching(false)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  if (authLoading || !user) return null

  const conversionRate = statsGlobales
    ? statsGlobales.vistas > 0
      ? ((statsGlobales.whatsapps / statsGlobales.vistas) * 100).toFixed(1) + '%'
      : '—'
    : '—'

  return (
    <main style={{ padding: '40px 0 100px', minHeight: '80vh', background: '#F8F6F3' }}>
      <div className="container">

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E8780A' }}>Herramienta privada</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#0F0F0F', letterSpacing: '-1.5px', lineHeight: 1 }}>
              Radar de<br /><span style={{ color: '#E8780A' }}>Productos</span>
            </h1>
            {/* Period filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[7, 14, 30].map(d => (
                <Chip key={d} label={`${d} días`} active={periodo === d} onClick={() => setPeriodo(d)} />
              ))}
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: '#888', maxWidth: 560 }}>
            Tus métricas internas de LIVOshop + tendencias en MercadoLibre Paraguay. Solo vos podés ver esto.
          </p>
        </div>

        {/* ── Stats globales ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle badge={`Últimos ${periodo} días`}>Tu tienda</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <StatCard label="Vistas" value={loadingStats ? '...' : fmt(statsGlobales?.vistas ?? 0)} sub="páginas de producto" />
            <StatCard label="Interés WhatsApp" value={loadingStats ? '...' : fmt(statsGlobales?.whatsapps ?? 0)} sub="consultas generadas" color="#25A244" />
            <StatCard label="Al carrito" value={loadingStats ? '...' : fmt(statsGlobales?.carritos ?? 0)} sub="productos agregados" color="#2563EB" />
            <StatCard label="Conversión" value={loadingStats ? '...' : conversionRate} sub="vistas → WhatsApp" color="#7C3AED" />
          </div>
        </section>

        {/* ── Top productos tuyos ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Tus productos más calientes</SectionTitle>
          {loadingStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} h={60} />)}
            </div>
          ) : topProductos.length === 0 ? (
            <div style={{ background: 'white', border: '1.5px solid #E8E4DE', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#888' }}>Sin datos todavía — los eventos se registran cuando los clientes ven productos.</p>
              <p style={{ fontSize: 12, color: '#BBB', marginTop: 8 }}>Asegurate de haber ejecutado el SQL del Radar en Supabase.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topProductos.map((p, i) => (
                <div key={p.id} style={{
                  background: 'white', border: '1.5px solid #E8E4DE', borderRadius: 10,
                  padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}>
                  <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 12, fontWeight: 900, color: i < 3 ? '#E8780A' : '#DDD', minWidth: 24 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: p.activo === false ? '#AAA' : '#0F0F0F' }}>
                      {p.nombre}
                      {p.activo === false && <span style={{ marginLeft: 8, fontSize: 10, background: '#FAECE7', color: '#993C1D', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>INACTIVO</span>}
                    </p>
                    {p.categoria && <p style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>{p.categoria}{p.precio_gs ? ` · Gs. ${p.precio_gs.toLocaleString('es-PY')}` : ''}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <EventosBadge count={p.vista || 0} label="vistas" color="#888" />
                    <EventosBadge count={p.whatsapp || 0} label="WA" color="#25A244" />
                    <EventosBadge count={p.carrito || 0} label="carrito" color="#2563EB" />
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 60 }}>
                    <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 11, fontWeight: 900, color: '#E8780A' }}>{p.score}</span>
                    <p style={{ fontSize: 9, color: '#BBB', letterSpacing: '0.05em' }}>SCORE</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Divisor ── */}
        <div style={{ borderTop: '1px solid #E8E4DE', marginBottom: 48 }} />

        {/* ── ML Global Trends ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle badge="MercadoLibre PY · En tiempo real">Lo más buscado en Paraguay</SectionTitle>
          {loadingTrendsGlobal ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} h={44} />)}
            </div>
          ) : trendsGlobal.length === 0 ? (
            <p style={{ fontSize: 13, color: '#AAA' }}>No se pudo cargar — MercadoLibre puede tener CORS activo. Verificá desde un entorno con backend o en producción.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {trendsGlobal.map((t, i) => <TrendKeyword key={t.keyword} keyword={t.keyword} url={t.url} rank={i + 1} />)}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#BBB', marginTop: 12 }}>
            Estas son las palabras más buscadas ahora en MercadoLibre Paraguay. Buena señal para elegir qué producto sumar.
          </p>
        </section>

        {/* ── Top sellers por categoría ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle badge="MercadoLibre PY">Más vendidos por categoría</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {CATEGORIAS.map(c => (
              <Chip key={c} label={c} active={catSeleccionada === c} onClick={() => setCatSeleccionada(c)} />
            ))}
          </div>
          {loadingML ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} h={64} />)}
            </div>
          ) : topSellers.length === 0 ? (
            <p style={{ fontSize: 13, color: '#AAA' }}>Sin resultados para esta categoría ahora. Probá de nuevo o cambiá la categoría.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topSellers.map((item, i) => <MLProductRow key={item.id} item={item} rank={i + 1} />)}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#BBB', marginTop: 12 }}>
            Productos reales de MercadoLibre PY ordenados por cantidad vendida. Si algo explota acá y vos no lo tenés → oportunidad.
          </p>
        </section>

        {/* ── Buscador de demanda ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Validar demanda de un producto</SectionTitle>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            Escribí el nombre de un producto que querés vender y fijate cuánto se mueve en Paraguay.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ej: plancha de cabello, auriculares inalámbricos..."
              style={{
                flex: 1, minWidth: 240,
                padding: '11px 16px', border: '1.5px solid #E8E4DE',
                borderRadius: 8, fontSize: 14, fontFamily: 'Instrument Sans, sans-serif',
                outline: 'none', background: 'white', color: '#0F0F0F',
              }}
              onFocus={e => e.target.style.borderColor = '#E8780A'}
              onBlur={e => e.target.style.borderColor = '#E8E4DE'}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              style={{
                background: '#E8780A', color: 'white', border: 'none',
                borderRadius: 8, padding: '11px 24px',
                fontFamily: 'Instrument Sans, sans-serif', fontSize: 13, fontWeight: 700,
                cursor: searching ? 'wait' : 'pointer', opacity: searching ? 0.7 : 1,
              }}
            >
              {searching ? 'Buscando...' : 'Analizar'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {searchResults.map((item, i) => <MLProductRow key={item.id} item={item} rank={i + 1} />)}
              </div>
              {/* Quick insight */}
              {(() => {
                const conVentas = searchResults.filter(r => r.vendidos > 0)
                const totalVendidos = searchResults.reduce((s, r) => s + (r.vendidos || 0), 0)
                const avgPrecio = searchResults.filter(r => r.precio).reduce((s, r) => s + r.precio, 0) / (searchResults.filter(r => r.precio).length || 1)
                return (
                  <div style={{ background: '#FFF0E0', border: '1.5px solid #FFD4A0', borderRadius: 10, padding: '16px 20px' }}>
                    <p style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 11, fontWeight: 800, color: '#E8780A', marginBottom: 8 }}>RESUMEN RAPIDO</p>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Unbounded, sans-serif', color: '#0F0F0F' }}>{fmt(totalVendidos)}</p>
                        <p style={{ fontSize: 11, color: '#888' }}>ventas totales visibles</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Unbounded, sans-serif', color: '#0F0F0F' }}>{conVentas.length}/{searchResults.length}</p>
                        <p style={{ fontSize: 11, color: '#888' }}>sellers activos</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Unbounded, sans-serif', color: '#0F0F0F' }}>Gs. {Math.round(avgPrecio).toLocaleString('es-PY')}</p>
                        <p style={{ fontSize: 11, color: '#888' }}>precio promedio</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </section>

        {/* ── Setup note ── */}
        <div style={{ background: '#0F0F0F', borderRadius: 14, padding: '24px 28px' }}>
          <p style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 11, fontWeight: 800, color: '#E8780A', marginBottom: 10, letterSpacing: '0.05em' }}>CONFIGURACION REQUERIDA</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            Para que el tracking interno funcione, ejecutá este SQL en tu Supabase:
          </p>
          <pre style={{
            background: '#1C1C1C', borderRadius: 8, padding: '16px', marginTop: 12,
            fontSize: 12, color: '#AAA', overflowX: 'auto', lineHeight: 1.6,
            fontFamily: 'monospace',
          }}>{`create table producto_eventos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id) on delete cascade,
  tipo text check (tipo in ('vista','whatsapp','carrito')),
  creado_en timestamptz default now()
);

-- Índice para que las queries del radar sean rápidas
create index on producto_eventos (producto_id, creado_en);
create index on producto_eventos (tipo, creado_en);

-- Row Level Security: solo el admin puede leer
alter table producto_eventos enable row level security;
create policy "admin_read" on producto_eventos for select using (auth.role() = 'authenticated');
create policy "anon_insert" on producto_eventos for insert with check (true);`}</pre>
        </div>

      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </main>
  )
}
