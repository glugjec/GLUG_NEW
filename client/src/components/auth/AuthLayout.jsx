export default function AuthLayout({ children }) {
  return (
    <div className="auth-scene">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />
      <div className="auth-grid" />
      <div className="auth-noise" />
      <div className="auth-stage">
        <div className="auth-penguin">
          <img
            src="/tux.png"
            alt="Tux holding the login card"
            draggable="false"
          />
        </div>
        {children}
      </div>
    </div>
  )
}