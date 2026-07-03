export default function PlayerLoading() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk{background:linear-gradient(90deg,#f0f2f5 25%,#e4e7eb 50%,#f0f2f5 75%);background-size:800px 100%;animation:shimmer 1.4s infinite;border-radius:6px}
      `}</style>
      {/* Sidebar */}
      <div
        style={{
          width: 300,
          borderRight: '1px solid #eaecf0',
          background: '#fff',
          padding: 20,
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        <div className="sk" style={{ height: 20, width: '80%', marginBottom: 20 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div className="sk" style={{ height: 16, width: '60%', marginBottom: 10 }} />
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <div
                  className="sk"
                  style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }}
                />
                <div className="sk" style={{ height: 13, flex: 1 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Player area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f1014' }}>
        <div
          className="sk"
          style={{ flex: '0 0 56.25%', maxHeight: '60vh', borderRadius: 0, background: '#1a1c22' }}
        />
        <div style={{ padding: 24 }}>
          <div
            className="sk"
            style={{ height: 22, width: '50%', marginBottom: 12, background: '#2a2c32' }}
          />
          <div className="sk" style={{ height: 15, width: '35%', background: '#2a2c32' }} />
        </div>
      </div>
    </div>
  )
}
