export default function CursosPublicosLoading() {
  return (
    <div className="content">
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk{background:linear-gradient(90deg,#f0f2f5 25%,#e4e7eb 50%,#f0f2f5 75%);background-size:800px 100%;animation:shimmer 1.4s infinite;border-radius:6px}
      `}</style>
      <div className="sk" style={{ height: 26, width: 160, marginBottom: 8 }} />
      <div className="sk" style={{ height: 15, width: 220, marginBottom: 24 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 20,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #eaecf0',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div className="sk" style={{ height: 160, borderRadius: 0 }} />
            <div style={{ padding: 18 }}>
              <div className="sk" style={{ height: 18, width: '85%', marginBottom: 10 }} />
              <div className="sk" style={{ height: 13, marginBottom: 6 }} />
              <div className="sk" style={{ height: 13, width: '70%', marginBottom: 18 }} />
              <div className="sk" style={{ height: 38, borderRadius: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
