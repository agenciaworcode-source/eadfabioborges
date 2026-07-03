export default function MatriculasLoading() {
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
          <div className="sk" style={{ height: 28, width: 160, marginBottom: 8 }} />
          <div className="sk" style={{ height: 15, width: 200 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="sk" style={{ height: 38, width: 130, borderRadius: 8 }} />
          <div className="sk" style={{ height: 38, width: 150, borderRadius: 8 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="sk" style={{ height: 42, flex: 1, minWidth: 200, borderRadius: 8 }} />
        <div className="sk" style={{ height: 42, width: 160, borderRadius: 8 }} />
        <div className="sk" style={{ height: 42, width: 140, borderRadius: 8 }} />
        <div className="sk" style={{ height: 42, width: 140, borderRadius: 8 }} />
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
          {['28%', '22%', '12%', '12%', '12%', '8%'].map((w, i) => (
            <div key={i} className="sk" style={{ height: 14, width: w }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '13px 20px',
              borderBottom: '1px solid #f5f5f5',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '28%' }}>
              <div
                className="sk"
                style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ height: 14, marginBottom: 5 }} />
                <div className="sk" style={{ height: 12, width: '65%' }} />
              </div>
            </div>
            {['22%', '12%', '12%', '12%', '8%'].map((w, j) => (
              <div key={j} className="sk" style={{ height: 14, width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
