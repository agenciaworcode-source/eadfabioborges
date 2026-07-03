export default function RelatoriosLoading() {
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
        </div>
        <div className="sk" style={{ height: 38, width: 160, borderRadius: 8 }} />
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk" style={{ height: 90, borderRadius: 12 }} />
        ))}
      </div>
      <div className="sk" style={{ height: 300, borderRadius: 12 }} />
    </div>
  )
}
