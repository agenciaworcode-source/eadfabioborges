export default function CertificadosLoading() {
  return (
    <div className="content">
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk{background:linear-gradient(90deg,#f0f2f5 25%,#e4e7eb 50%,#f0f2f5 75%);background-size:800px 100%;animation:shimmer 1.4s infinite;border-radius:6px}
      `}</style>
      <div className="sk" style={{ height: 26, width: 180, marginBottom: 24 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: '#fff',
            border: '1px solid #eaecf0',
            borderRadius: 12,
            padding: 20,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div className="sk" style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ height: 17, width: '60%', marginBottom: 8 }} />
            <div className="sk" style={{ height: 13, width: '40%' }} />
          </div>
          <div className="sk" style={{ height: 36, width: 120, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  )
}
