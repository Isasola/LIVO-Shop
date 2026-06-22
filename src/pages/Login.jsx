import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await login(email, password)
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700 }}>Panel Admin</h1>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '6px' }}>LIVOshop</p>
        </div>

        <div style={{ background: 'white', border: '1.5px solid #E8E4DE', borderRadius: '16px', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="livoshoop@gmail.com"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>
            {error && <p style={{ fontSize: '13px', color: '#E24B4A', textAlign: 'center' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#E8780A', color: 'white', border: 'none',
                borderRadius: '10px', padding: '13px',
                fontSize: '15px', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '4px',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #E8E4DE', borderRadius: '8px',
  fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
  outline: 'none', color: '#1A1A1A',
  background: 'white',
}
