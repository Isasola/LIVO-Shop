export default function Logo({ size = 200, dark = false }) {
  return (
    <img
      src="/logo.png"
      alt="LIVOshop"
      style={{ width: size, height: 'auto', display: 'block' }}
    />
  )
}
