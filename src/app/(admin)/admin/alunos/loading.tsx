export default function AlunosLoading() {
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
          <div className="sk" style={{ height: 15, width: 160 }} />
        </div>
        <div className="sk" style={{ height: 38, width: 120, borderRadius: 8 }} />
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid #eaecf0',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #eaecf0',
            display: 'flex',
            gap: 12,
          }}
        >
          {['25%', '20%', '15%', '15%', '15%', '10%'].map((w, i) => (
            <div key={i} className="sk" style={{ height: 14, width: w }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #f5f5f5',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '25%' }}>
              <div
                className="sk"
                style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ height: 14, marginBottom: 5 }} />
                <div className="sk" style={{ height: 12, width: '70%' }} />
              </div>
            </div>
            {['20%', '15%', '15%', '15%', '10%'].map((w, j) => (
              <div key={j} className="sk" style={{ height: 14, width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
