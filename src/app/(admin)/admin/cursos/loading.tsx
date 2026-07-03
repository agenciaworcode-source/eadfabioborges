export default function CursosLoading() {
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
          <div className="sk" style={{ height: 28, width: 120, marginBottom: 8 }} />
          <div className="sk" style={{ height: 15, width: 180 }} />
        </div>
        <div className="sk" style={{ height: 38, width: 130, borderRadius: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24 }}>
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '1px solid #eaecf0',
                borderRadius: 10,
                padding: '14px',
                marginBottom: 8,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div
                className="sk"
                style={{ width: 52, height: 34, borderRadius: 7, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ height: 16, width: '75%', marginBottom: 6 }} />
                <div className="sk" style={{ height: 12, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
        <div
          style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 12, padding: 24 }}
        >
          <div className="sk" style={{ height: 22, width: 200, marginBottom: 20 }} />
          <div className="sk" style={{ height: 160, marginBottom: 16, borderRadius: 10 }} />
          <div className="sk" style={{ height: 42, marginBottom: 12 }} />
          <div className="sk" style={{ height: 42, marginBottom: 12 }} />
          <div className="sk" style={{ height: 42 }} />
        </div>
      </div>
    </div>
  )
}
