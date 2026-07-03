export default function AvaliacoesLoading() {
  return (
    <div className="content wide">
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk{background:linear-gradient(90deg,#f0f2f5 25%,#e4e7eb 50%,#f0f2f5 75%);background-size:800px 100%;animation:shimmer 1.4s infinite;border-radius:6px}
      `}</style>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <div className="sk" style={{ height: 28, width: 180, marginBottom: 8 }} />
          <div className="sk" style={{ height: 15, width: 240 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 52, marginBottom: 8, borderRadius: 10 }} />
          ))}
        </div>
        <div
          style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 12, padding: 24 }}
        >
          <div className="sk" style={{ height: 20, width: '40%', marginBottom: 20 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div className="sk" style={{ height: 80, borderRadius: 10 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
