import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const EMPTY = {
  nombre: '', precio_gs: '', descripcion: '',
  categoria: '', tipo: 'stock', variantes: '',
  activo: true, destacado: false,
}

const CATEGORIAS = ['Belleza', 'Higiene', 'Cabello', 'Electrónica', 'Hogar', 'Deporte', 'Otro']

export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [view, setView] = useState('list') // 'list' | 'form'
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  const fetchAll = async () => {
    const { data } = await supabase.from('productos').select('*').order('creado_en', { ascending: false })
    setProductos(data || [])
  }

  const uploadImages = async () => {
    if (!files.length) return []
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('productos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('productos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) return setMsg('El nombre es obligatorio')
    setSaving(true)
    setUploading(files.length > 0)

    const newUrls = await uploadImages()
    setUploading(false)

    const payload = {
      nombre: form.nombre.trim(),
      precio_gs: form.precio_gs ? parseInt(form.precio_gs) : null,
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria || null,
      tipo: form.tipo,
      variantes: form.variantes ? form.variantes.split(',').map(v => v.trim()).filter(Boolean) : [],
      activo: form.activo,
      destacado: form.destacado,
    }

    if (editId) {
      // Keep existing images + add new ones
      const existing = productos.find(p => p.id === editId)
      payload.imagenes = [...(existing?.imagenes || []), ...newUrls]
      const { error } = await supabase.from('productos').update(payload).eq('id', editId)
      if (error) setMsg('Error al guardar: ' + error.message)
      else { setMsg('✓ Producto actualizado'); resetForm() }
    } else {
      payload.imagenes = newUrls
      const { error } = await supabase.from('productos').insert(payload)
      if (error) setMsg('Error al guardar: ' + error.message)
      else { setMsg('✓ Producto creado'); resetForm() }
    }

    setSaving(false)
    fetchAll()
    setTimeout(() => setMsg(''), 3000)
  }

  const handleEdit = (p) => {
    setEditId(p.id)
    setForm({
      nombre: p.nombre || '',
      precio_gs: p.precio_gs || '',
      descripcion: p.descripcion || '',
      categoria: p.categoria || '',
      tipo: p.tipo || 'stock',
      variantes: (p.variantes || []).join(', '),
      activo: p.activo ?? true,
      destacado: p.destacado ?? false,
    })
    setFiles([])
    setView('form')
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('productos').delete().eq('id', id)
    fetchAll()
  }

  const handleToggle = async (p) => {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    fetchAll()
  }

  const removeImage = async (productId, imgUrl) => {
    const product = productos.find(p => p.id === productId)
    const newImgs = (product.imagenes || []).filter(u => u !== imgUrl)
    await supabase.from('productos').update({ imagenes: newImgs }).eq('id', productId)
    fetchAll()
  }

  const resetForm = () => {
    setForm(EMPTY)
    setEditId(null)
    setFiles([])
    setView('list')
  }

  if (authLoading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Cargando...</p></div>
  if (!user) return null

  return (
    <main style={{ padding: '32px 0 80px', minHeight: '80vh' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700 }}>Panel Admin</h1>
            <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '2px' }}>{productos.length} productos en total</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/radar')} style={{...btnSecondary, borderColor: '#E8780A', color: '#E8780A', fontWeight: 700}}>
              Radar
            </button>
            {view === 'list' ? (
              <button onClick={() => { resetForm(); setView('form') }} style={btnPrimary}>
                + Nuevo producto
              </button>
            ) : (
              <button onClick={resetForm} style={btnSecondary}>← Volver</button>
            )}
            <button onClick={() => { logout(); navigate('/') }} style={btnSecondary}>Salir</button>
          </div>
        </div>

        {msg && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
            background: msg.startsWith('✓') ? '#EAF3DE' : '#FCEBEB',
            color: msg.startsWith('✓') ? '#3B6D11' : '#A32D2D',
            fontSize: '14px', fontWeight: 500,
          }}>
            {msg}
          </div>
        )}

        {/* FORM */}
        {view === 'form' && (
          <div style={{ background: 'white', border: '1.5px solid #E8E4DE', borderRadius: '16px', padding: '32px', maxWidth: '680px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
              {editId ? 'Editar producto' : 'Nuevo producto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Nombre */}
              <Field label="Nombre del producto *">
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Cepillo Eléctrico Sónico ZD-X3" style={inputStyle} />
              </Field>

              {/* Precio */}
              <Field label="Precio en Guaraníes (opcional por ahora)">
                <input type="number" value={form.precio_gs} onChange={e => setForm({...form, precio_gs: e.target.value})} placeholder="Ej: 150000" style={inputStyle} />
                <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px' }}>Dejá vacío para mostrar "Consultar precio"</p>
              </Field>

              {/* Descripción */}
              <Field label="Descripción">
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción del producto, características, etc." rows={3} style={{...inputStyle, resize: 'vertical'}} />
              </Field>

              {/* Categoria + Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Categoría">
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={inputStyle}>
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={inputStyle}>
                    <option value="stock">Stock propio</option>
                    <option value="dropshipping">Dropshipping (Dropi)</option>
                  </select>
                </Field>
              </div>

              {/* Variantes */}
              <Field label="Variantes (opcional)">
                <input value={form.variantes} onChange={e => setForm({...form, variantes: e.target.value})} placeholder="Ej: Negro, Blanco, Rosa (separadas por coma)" style={inputStyle} />
              </Field>

              {/* Checkboxes */}
              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} />
                  Activo (visible en la tienda)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.destacado} onChange={e => setForm({...form, destacado: e.target.checked})} />
                  Destacado
                </label>
              </div>

              {/* Imágenes */}
              <Field label="Fotos del producto">
                <div style={{
                  border: '2px dashed #E8E4DE', borderRadius: '10px',
                  padding: '24px', textAlign: 'center',
                  cursor: 'pointer', position: 'relative',
                }}>
                  <input
                    type="file" multiple accept="image/*"
                    onChange={e => setFiles(Array.from(e.target.files))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                  <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
                    {files.length > 0 ? `${files.length} foto(s) seleccionada(s)` : 'Tocá para seleccionar fotos'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>JPG, PNG — hasta 50MB por imagen</p>
                </div>
                {files.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {files.map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E8E4DE' }} />
                    ))}
                  </div>
                )}
              </Field>

              {/* Existing images when editing */}
              {editId && (() => {
                const p = productos.find(x => x.id === editId)
                const imgs = p?.imagenes || []
                if (!imgs.length) return null
                return (
                  <Field label="Fotos actuales">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {imgs.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E8E4DE' }} />
                          <button
                            onClick={() => removeImage(editId, url)}
                            style={{
                              position: 'absolute', top: '-6px', right: '-6px',
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: '#E24B4A', color: 'white', border: 'none',
                              fontSize: '11px', cursor: 'pointer', lineHeight: 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </Field>
                )
              })()}

              <button
                onClick={handleSave}
                disabled={saving}
                style={{...btnPrimary, padding: '13px', fontSize: '15px', opacity: saving ? 0.7 : 1}}
              >
                {uploading ? 'Subiendo fotos...' : saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        )}

        {/* LIST */}
        {view === 'list' && (
          <div>
            {productos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B6B6B' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <p style={{ fontSize: '16px' }}>Todavía no hay productos</p>
                <button onClick={() => setView('form')} style={{...btnPrimary, marginTop: '16px'}}>+ Agregar el primero</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {productos.map(p => (
                  <div key={p.id} style={{
                    background: 'white',
                    border: `1.5px solid ${p.activo ? '#E8E4DE' : '#F5C4B3'}`,
                    borderRadius: '12px', padding: '16px 20px',
                    display: 'flex', gap: '16px', alignItems: 'center',
                    opacity: p.activo ? 1 : 0.7,
                  }}>
                    {p.imagenes?.[0] && (
                      <img src={p.imagenes[0]} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, fontSize: '15px', fontFamily: 'Syne, sans-serif' }}>{p.nombre}</p>
                        {p.destacado && <span style={{ fontSize: '10px', background: '#FFF0E0', color: '#E8780A', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>DESTACADO</span>}
                        {!p.activo && <span style={{ fontSize: '10px', background: '#FAECE7', color: '#993C1D', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>INACTIVO</span>}
                        <span style={{ fontSize: '10px', background: '#F5F3EF', color: '#6B6B6B', padding: '2px 8px', borderRadius: '10px' }}>{p.tipo}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '2px' }}>
                        {p.categoria && `${p.categoria} · `}
                        {p.precio_gs ? `Gs. ${p.precio_gs.toLocaleString('es-PY')}` : 'Precio a consultar'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button onClick={() => handleToggle(p)} style={{...btnSecondary, fontSize: '12px', padding: '6px 12px'}}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => handleEdit(p)} style={{...btnSecondary, fontSize: '12px', padding: '6px 12px'}}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{...btnDanger, fontSize: '12px', padding: '6px 12px'}}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px', color: '#1A1A1A' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #E8E4DE', borderRadius: '8px',
  fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
  outline: 'none', color: '#1A1A1A', background: 'white',
}

const btnPrimary = {
  background: '#E8780A', color: 'white', border: 'none',
  borderRadius: '8px', padding: '9px 18px',
  fontSize: '13px', fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
}

const btnSecondary = {
  background: 'white', color: '#1A1A1A',
  border: '1.5px solid #E8E4DE',
  borderRadius: '8px', padding: '9px 18px',
  fontSize: '13px', fontWeight: 500,
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
}

const btnDanger = {
  background: '#FCEBEB', color: '#A32D2D', border: 'none',
  borderRadius: '8px', padding: '9px 18px',
  fontSize: '13px', fontWeight: 500,
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
}
