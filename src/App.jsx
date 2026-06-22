import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Cart from './components/Cart'
import Home from './pages/Home'
import Producto from './pages/Producto'
import Admin from './pages/Admin'
import Radar from './pages/Radar'
import Login from './pages/Login'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <Cart />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/radar" element={<Radar />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </>
  )
}
