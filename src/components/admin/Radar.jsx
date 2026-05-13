import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #E8780A 0%, #B85C00 100%)'

export default function Radar() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'recommended' | 'hot' | 'low-comp' | 'with-ideas'
  const [importing, setImporting] = useState({})
  const [toast, setToast] = useState(null)
  const [dailyReport, setDailyReport] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [contentIdeas, setContentIdeas] = useState([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)

  useEffect(() => {
    fetchRadarProducts()
    fetchDailyReport()
  }, [])

  const fetchRadarProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('trending_products')
        .select('*')
        .order('trend_score', { ascending: false })
      
      if (err) throw err
      setProducts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyReport = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('radar_daily_report')
      .select('*')
      .eq('fecha', today)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (data && data[0]) setDailyReport(data[0])
  }

  const fetchContentIdeas = async (productId) => {
    setLoadingIdeas(true)
    const { data } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('producto_id', productId)
    
    setContentIdeas(data || [])
    setLoadingIdeas(false)
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'recommended') return p.vale_la_pena === true
    if (filter === 'hot') return p.trend_score >= 85
    if (filter === 'low-comp') return p.competition === 'low'
    // For 'with-ideas', we'd ideally need a join or a flag, but for now we filter locally
    return true
  })

  const handleImport = async (product) => {
    setImporting(prev => ({ ...prev, [product.id]: true }))
    try {
      const newProduct = {
        nombre: product.nombre,
        categoria: product.categoria,
        descripcion: `Detectado por LIVO Radar con ${product.ads_count} ads activos. Análisis: ${product.analisis_gemini}`,
        precio_gs: product.precio_venta_sugerido_gs,
        tipo: 'dropshipping',
        activo: false,
        destacado: false,
        imagenes: product.image_url ? [product.image_url] : [],
      }
      const { error: insertErr } = await supabase.from('productos').insert(newProduct)
      if (insertErr) throw insertErr
      const { error: updateErr } = await supabase.from('trending_products').update({ status: 'imported' }).eq('id', product.id)
      if (updateErr) throw updateErr
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'imported' } : p))
      showToast('✓ Producto importado al catálogo', 'success')
    } catch (err) {
      showToast('Error al importar: ' + err.message, 'error')
    } finally {
      setImporting(prev => ({ ...prev, [product.id]: false }))
    }
  }

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openIdeas = (product) => {
    setSelectedProduct(product)
    fetchContentIdeas(product.id)
  }

  const getMargenColor = (pct) => {
    if (pct > 30) return '#3B6D11'
    if (pct > 15) return '#E8780A'
    return '#A32D2D'
  }

  return (
    <div style={{ padding: '0 0 32px', position: 'relative' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '20px', right: '20px', padding: '12px 16px', borderRadius: '10px',
              background: toast.type === 'success' ? '#EAF3DE' : '#FCEBEB',
              color: toast.type === 'success' ? '#3B6D11' : '#A32D2D',
              fontSize: '14px', fontWeight: 500, zIndex: 1000,
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Report Banner */}
      {dailyReport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white', border: '2px solid var(--brand)', borderRadius: '16px',
            padding: '24px', marginBottom: '40px', position: 'relative', overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 16px', background: 'var(--brand)', color: 'white', fontSize: '12px', fontWeight: 700, borderBottomLeftRadius: '12px' }}>
            REPORTE DEL DÍA
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: 'var(--dark)' }}>
            {dailyReport.titulo}
          </h2>
          <div style={{ display: 'inline-block', background: 'var(--brand-light)', color: 'var(--brand)', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
            ⭐ Producto Estrella: {dailyReport.producto_estrella}
          </div>
          <p style={{ fontSize: '15px', color: '#444', marginBottom: '20px', lineHeight: 1.5 }}>{dailyReport.resumen}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#3B6D11', textTransform: 'uppercase', marginBottom: '4px' }}>Acción Inmediata:</p>
              <p style={{ fontSize: '14px', color: '#333' }}>{dailyReport.accion_inmediata}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '4px' }}>🎥 Idea de video rápida:</p>
              <p style={{ fontSize: '14px', color: '#333' }}>{dailyReport.por_que_hoy}</p>
            </div>
          </div>
          {dailyReport.advertencia && (
            <div style={{ marginTop: '20px', padding: '12px', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', color: '#92400E', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              ⚠️ <strong>Atención:</strong> {dailyReport.advertencia}
            </div>
          )}
        </motion.div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          🔥 LIVO Radar
        </h2>
        <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
          Inteligencia de mercado y contenido para Paraguay
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'recommended', label: '✓ Recomendados' },
          { id: 'hot', label: '🔥 HOT' },
          { id: 'low-comp', label: '📉 Baja competencia' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: filter === f.id ? 'var(--brand)' : '#F0F0F0',
              color: filter === f.id ? 'white' : '#6B6B6B',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ background: '#F0F0F0', borderRadius: '12px', height: '450px' }} className="animate-pulse" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredProducts.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{ background: 'white', border: '1px solid #E8E4DE', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: '180px', background: p.image_url ? `url(${p.image_url}) center/cover` : PLACEHOLDER_GRADIENT, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {p.vale_la_pena ? (
                    <span style={{ background: '#3B6D11', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>✓ VALE LA PENA</span>
                  ) : (
                    <span style={{ background: '#A32D2D', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>✗ NO RECOMENDADO</span>
                  )}
                  {p.trend_score >= 85 && <span style={{ background: 'var(--brand)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>🔥 HOT</span>}
                </div>
              </div>
              
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{p.nombre}</h3>
                <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '16px' }}>{p.categoria}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Precio Sugerido</p>
                    <p style={{ fontSize: '16px', fontWeight: 700 }}>₲ {p.precio_venta_sugerido_gs?.toLocaleString('es-PY') || '---'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Margen Est.</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: getMargenColor(p.margen_estimado_pct) }}>{p.margen_estimado_pct}%</p>
                  </div>
                </div>

                <div style={{ background: '#F9F9F9', padding: '12px', borderRadius: '8px', marginBottom: '16px', flex: 1 }}>
                  <p style={{ fontSize: '12px', color: '#444', fontStyle: 'italic' }}>"{p.analisis_gemini}"</p>
                </div>

                {p.alerta && (
                  <div style={{ padding: '8px 12px', background: '#FFFBEB', borderRadius: '8px', color: '#92400E', fontSize: '11px', marginBottom: '16px', display: 'flex', gap: '6px' }}>
                    ⚠️ {p.alerta}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openIdeas(p)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--brand)', background: 'white', color: 'var(--brand)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    💡 Ideas Video
                  </button>
                  <button
                    onClick={() => handleImport(p)}
                    disabled={p.status === 'imported' || importing[p.id]}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: p.status === 'imported' ? '#F0F0F0' : 'var(--brand)', color: p.status === 'imported' ? '#999' : 'white', fontSize: '12px', fontWeight: 700, cursor: p.status === 'imported' ? 'not-allowed' : 'pointer' }}
                  >
                    {p.status === 'imported' ? '✓ Importado' : importing[p.id] ? '⏳...' : '→ Importar'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Side Panel for Ideas */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '500px', background: 'white', zIndex: 1001, overflowY: 'auto', padding: '40px' }}
            >
              <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>💡 Ideas de Contenido</h2>
              <p style={{ color: '#6B6B6B', marginBottom: '32px' }}>{selectedProduct.nombre}</p>

              {loadingIdeas ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Cargando ideas...</div>
              ) : contentIdeas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No se encontraron ideas para este producto.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {contentIdeas.map(idea => (
                    <div key={idea.id} style={{ borderBottom: '1px solid #EEE', paddingBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ background: '#F0F0F0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{idea.plataforma}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>{idea.formato} · {idea.duracion_segundos}s</span>
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Hook (Primeros 3 seg):</p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dark)', lineHeight: 1.3 }}>"{idea.hook}"</p>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Guión Escena por Escena:</p>
                        <div style={{ fontSize: '14px', color: '#444', whiteSpace: 'pre-line', lineHeight: 1.6, background: '#F9F9F9', padding: '16px', borderRadius: '12px' }}>
                          {idea.guion}
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Música Sugerida:</p>
                        <p style={{ fontSize: '14px', color: '#444' }}>🎵 {idea.musica_sugerida}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(idea.hashtags || []).map(h => <span key={h} style={{ fontSize: '11px', color: '#6B6B6B', background: '#F0F0F0', padding: '2px 8px', borderRadius: '4px' }}>#{h}</span>)}
                      </div>
                    </div>
                  ))}
                  
                  {contentIdeas[0]?.competidor_referencia && (
                    <div style={{ background: '#FFF4E8', padding: '20px', borderRadius: '16px', border: '1px solid var(--brand-light)' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)', marginBottom: '12px' }}>🕵️ LO QUE HACE LA COMPETENCIA</p>
                      <p style={{ fontSize: '13px', marginBottom: '8px' }}><strong>Competidor:</strong> {contentIdeas[0].competidor_referencia}</p>
                      <p style={{ fontSize: '13px', marginBottom: '8px' }}><strong>Formato:</strong> {contentIdeas[0].competidor_formato}</p>
                      <p style={{ fontSize: '13px' }}><strong>Hook:</strong> "{contentIdeas[0].competidor_hook}"</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
