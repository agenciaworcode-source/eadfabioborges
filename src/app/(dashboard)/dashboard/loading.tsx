export default function DashboardLoading() {
  return (
    <div className="content">
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk{background:linear-gradient(90deg,#f0f2f5 25%,#e4e7eb 50%,#f0f2f5 75%);background-size:800px 100%;animation:shimmer 1.4s infinite;border-radius:6px}
      `}</style>
      <div className="sk" style={{ height: 24, width: 220, marginBottom: 24 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #eaecf0',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div className="sk" style={{ height: 140, borderRadius: 0 }} />
            <div style={{ padding: 16 }}>
              <div className="sk" style={{ height: 17, width: '80%', marginBottom: 8 }} />
              <div className="sk" style={{ height: 13, width: '55%', marginBottom: 14 }} />
              <div className="sk" style={{ height: 6, borderRadius: 999, marginBottom: 6 }} />
              <div className="sk" style={{ height: 12, width: '35%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
