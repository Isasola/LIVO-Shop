import { useCart } from '../lib/CartContext'

export default function Navbar() {
  const { count, setOpen } = useCart()

  return (
    <>
      <nav style={s.nav}>
        <div className="container" style={s.inner}>
          <a href="/" style={{ display:'flex', alignItems:'center' }}>
            <img src="/logo.png" alt="LIVOshop" style={{ height: 44, width: 'auto',  }} />
          </a>
          <div style={s.right}>
            <a href="https://wa.me/595991273055" target="_blank" rel="noreferrer"
              style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#0F0F0F', color: 'white',
                borderRadius: 6, padding: '9px 16px',
                fontSize: 12, fontWeight: 600,
                fontFamily: 'Satoshi, sans-serif',
                textDecoration: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#25D366'}
              onMouseLeave={e => e.currentTarget.style.background = '#0F0F0F'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
              <span style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, opacity: 0.6,
              }}>→</span>
            </a>
            <button onClick={() => setOpen(true)} style={s.cart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {count > 0 && <span style={s.badge}>{count}</span>}
            </button>
          </div>
        </div>
      </nav>
      <div style={{ height: 68 }} />
    </>
  )
}

const s = {
  nav: {
    position:'fixed', top:0, left:0, right:0, zIndex:100,
    background:'rgba(255,255,255,0.96)',
    backdropFilter:'blur(20px)',
    borderBottom:'1px solid #EBEBEB',
    height:68,
  },
  inner: { display:'flex', alignItems:'center', justifyContent:'space-between', height:68 },
  right: { display:'flex', alignItems:'center', gap:8 },
  cart: {
    position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
    background:'none', border:'1.5px solid #E8E4DE',
    borderRadius:6, padding:'9px 13px', color:'#0F0F0F', cursor:'pointer',
  },
  badge: {
    position:'absolute', top:-7, right:-7,
    background:'#E8780A', color:'white',
    fontSize:9, fontWeight:800, borderRadius:'50%',
    width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
  },
}
