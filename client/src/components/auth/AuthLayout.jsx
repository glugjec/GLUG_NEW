export default function AuthLayout({ children }) {
  return (
    <div className="auth-scene">
      <div className="auth-glow-primary" />
      <div className="auth-glow-secondary" />
      <div className="auth-cyber-grid" />
      <div className="auth-stage">
        <div className="auth-penguin">
          <img
            src="/tux.png"
            alt="GLUG Tux"
            draggable="false"
          />
        </div>
        {children}
      </div>
    </div>
  );
}