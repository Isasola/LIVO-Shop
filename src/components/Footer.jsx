export default function Footer() {
  return (
    <footer style={{ background: '#0F0F0F', padding: '48px 0 32px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 16, color: 'white' }}>LIVO</span>
              <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 400, fontSize: 16, color: '#E8780A' }}>shop</span>
            </div>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
              Línea inteligente de ventas online. Los mejores productos en Paraguay.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: 14 }}>Contacto</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://wa.me/595991273055" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>WhatsApp: 0991 273 055</a>
              <a href="mailto:livoshoop@gmail.com" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>livoshoop@gmail.com</a>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: 14 }}>Redes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://instagram.com/livoshop_" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Instagram — @livoshop_</a>
              <a href="https://facebook.com/LIVOshop" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Facebook — LIVOshop</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1C1C1C', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#444' }}>© 2026 LIVOshop · Paraguay</p>
          <p style={{ fontSize: 12, color: '#444' }}>Ventas online</p>
        </div>
      </div>
    </footer>
  )
}
