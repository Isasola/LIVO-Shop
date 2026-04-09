import { useCart } from '../lib/CartContext'

export default function Cart() {
  const { items, open, setOpen, remove, updateQty, total, count, sendWhatsApp, clear } = useCart()

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '380px',
        maxWidth: '100vw',
        background: 'white',
        zIndex: 201,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8E4DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: '18px', fontWeight: 700 }}>Tu pedido</h2>
            {count > 0 && <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '2px' }}>{count} {count === 1 ? 'producto' : 'productos'}</p>}
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#6B6B6B', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6B6B' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <p style={{ fontSize: '15px' }}>Tu carrito está vacío</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Agregá productos para empezar</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(item => (
                <div key={item.key} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  background: '#F5F3EF', borderRadius: '10px', padding: '12px',
                }}>
                  {item.product.imagenes?.[0] && (
                    <img
                      src={item.product.imagenes[0]}
                      alt={item.product.nombre}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.nombre}
                    </p>
                    {item.variante && <p style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '2px' }}>{item.variante}</p>}
                    {item.product.precio_gs ? (
                      <p style={{ fontSize: '13px', color: '#E8780A', fontWeight: 600, marginTop: '4px' }}>
                        Gs. {(item.product.precio_gs * item.qty).toLocaleString('es-PY')}
                      </p>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px' }}>Precio a consultar</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateQty(item.key, item.qty - 1)} style={qtyBtn}>−</button>
                      <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.key, item.qty + 1)} style={qtyBtn}>+</button>
                    </div>
                    <button onClick={() => remove(item.key)} style={{ background: 'none', border: 'none', fontSize: '11px', color: '#999', cursor: 'pointer' }}>eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #E8E4DE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', color: '#6B6B6B' }}>Total estimado</span>
              <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                {total > 0 ? `Gs. ${total.toLocaleString('es-PY')}` : 'A consultar'}
              </span>
            </div>
            <button onClick={sendWhatsApp} style={{
              width: '100%',
              background: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Pedir por WhatsApp
            </button>
            <button onClick={clear} style={{ width: '100%', background: 'none', border: 'none', color: '#999', fontSize: '12px', marginTop: '10px', cursor: 'pointer' }}>
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  )
}

const qtyBtn = {
  width: '26px', height: '26px',
  background: 'white',
  border: '1px solid #E8E4DE',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'DM Sans, sans-serif',
}
