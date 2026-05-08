import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'

const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #E8780A 0%, #B85C00 100%)'

export default function Radar() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'hot' | 'low-comp'
  const [importing, setImporting] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchRadarProducts()
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

  const filteredProducts = products.filter(p => {
    if (filter === 'hot') return p.trend_score >= 85
    if (filter === 'low-comp') return p.competition === 'low'
    return true
  })

  const handleImport = async (product) => {
    setImporting(prev => ({ ...prev, [product.id]: true }))
    
    try {
      // Insert into productos
      const newProduct = {
        nombre: product.nombre,
        categoria: product.categoria,
        descripcion: `Detectado por LIVO Radar con ${product.ads_count} ads activos. Keywords: ${(product.detected_keywords || []).join(', ')}`,
        precio_gs: null,
        tipo: 'dropshipping',
        activo: false,
        destacado: false,
        imagenes: product.image_url ? [product.image_url] : [],
      }

      const { error: insertErr } = await supabase
        .from('productos')
        .insert(newProduct)
      
      if (insertErr) throw insertErr

      // Mark as imported
      const { error: updateErr } = await supabase
        .from('trending_products')
        .update({ status: 'imported' })
        .eq('id', product.id)
      
      if (updateErr) throw updateErr

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, status: 'imported' } : p
      ))

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

  const getCompetitionColor = (comp) => {
    if (comp === 'low') return '#3B6D11'
    if (comp === 'medium') return '#E8780A'
    return '#A32D2D'
  }

  const getTrendColor = (score) => {
    if (score >= 80) return '#3B6D11'
    if (score >= 60) return '#E8780A'
    return '#A32D2D'
  }

  const getSourceBadges = (source) => {
    const badges = []
    if (source?.includes('meta')) badges.push('Meta Ads')
    if (source?.includes('tiktok')) badges.push('TikTok')
    if (source?.includes('google')) badges.push('Google Trends')
    return badges
  }

  const getDaysAgo = (createdAt) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Hoy' : `Hace ${days} día${days > 1 ? 's' : ''}`
  }

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: toast.type === 'success' ? '#EAF3DE' : '#FCEBEB',
            color: toast.type === 'success' ? '#3B6D11' : '#A32D2D',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 1000,
          }}
        >
          {toast.msg}
        </motion.div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          🔥 LIVO Radar
        </h2>
        <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
          Productos trending detectados en tiempo real
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'hot', label: '🔥 HOT' },
          { id: 'low-comp', label: '📉 Baja competencia' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: filter === f.id ? 'var(--brand)' : '#F0F0F0',
              color: filter === f.id ? 'white' : '#6B6B6B',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Counter */}
      <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '24px' }}>
        {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} detectado{filteredProducts.length !== 1 ? 's' : ''}
      </p>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: '#F0F0F0',
                borderRadius: '12px',
                height: '400px',
              }}
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          background: '#FCEBEB',
          color: '#A32D2D',
          textAlign: 'center',
        }}>
          <p style={{ marginBottom: '12px' }}>Error: {error}</p>
          <button
            onClick={fetchRadarProducts}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#A32D2D',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          color: '#6B6B6B',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
            Todavía no hay productos detectados
          </p>
          <p style={{ fontSize: '13px' }}>
            El Radar se actualiza automáticamente cada 6 horas
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              style={{
                background: 'white',
                border: '1px solid #E8E4DE',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '160px',
                  background: product.image_url ? 'none' : PLACEHOLDER_GRADIENT,
                  backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Badges */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {product.trend_score >= 85 && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        background: '#A32D2D',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      HOT
                    </motion.div>
                  )}
                  {product.viral_score >= 80 && (
                    <div style={{
                      background: '#7C3AED',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}>
                      VIRAL
                    </div>
                  )}
                  {product.competition === 'low' && (
                    <div style={{
                      background: '#3B6D11',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}>
                      LOW COMP
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px' }}>
                {/* Name + Category */}
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  lineHeight: 1.3,
                }}>
                  {product.nombre}
                </h3>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    background: '#F0F0F0',
                    color: '#6B6B6B',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}>
                    {product.categoria}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #F0F0F0',
                }}>
                  {/* Trend Score */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px' }}>🔥 Trend</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: getTrendColor(product.trend_score) }}>
                      {product.trend_score}
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: '#F0F0F0',
                      borderRadius: '2px',
                      marginTop: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${product.trend_score}%`,
                        height: '100%',
                        background: getTrendColor(product.trend_score),
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  {/* Ads Count */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px' }}>📢 Ads</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>
                      {product.ads_count}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6B6B6B', marginTop: '4px' }}>
                      anuncios
                    </div>
                  </div>

                  {/* Viral Score */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px' }}>⚡ Viral</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#E8780A' }}>
                      {product.viral_score}
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: '#F0F0F0',
                      borderRadius: '2px',
                      marginTop: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${product.viral_score}%`,
                        height: '100%',
                        background: '#E8780A',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  {/* Competition */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px' }}>🏆 Comp</div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: getCompetitionColor(product.competition),
                    }}>
                      {product.competition?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Sources + Date */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {getSourceBadges(product.source).map(badge => (
                      <span
                        key={badge}
                        style={{
                          background: '#FFF4E8',
                          color: '#E8780A',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 500,
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {getDaysAgo(product.created_at)}
                  </div>
                </div>

                {/* Import Button */}
                {product.status !== 'imported' ? (
                  <button
                    onClick={() => handleImport(product)}
                    disabled={importing[product.id]}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius)',
                      border: 'none',
                      background: 'var(--brand)',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: importing[product.id] ? 'not-allowed' : 'pointer',
                      opacity: importing[product.id] ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {importing[product.id] ? '⏳ Importando...' : '→ Importar producto'}
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius)',
                      border: 'none',
                      background: '#F0F0F0',
                      color: '#6B6B6B',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                    }}
                  >
                    ✓ Importado
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
