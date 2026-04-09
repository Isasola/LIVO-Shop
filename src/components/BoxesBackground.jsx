import { motion } from 'framer-motion'

const COLORS = ['rgba(232,120,10,0.6)', 'rgba(245,166,35,0.5)', 'rgba(180,80,0,0.4)']

export default function BoxesBackground() {
  const rows = Array(20).fill(0)
  const cols = Array(15).fill(0)
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      transform: 'translate(-20%, -20%) skewX(-10deg) skewY(5deg) scale(1.4)',
    }}>
      {rows.map((_, i) => (
        <div key={i} style={{ display: 'flex' }}>
          {cols.map((_, j) => (
            <motion.div
              key={j}
              whileHover={{ backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)], transition: { duration: 0 } }}
              style={{
                width: 48, height: 32, flexShrink: 0,
                border: '1px solid rgba(232,120,10,0.12)',
                backgroundColor: 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
