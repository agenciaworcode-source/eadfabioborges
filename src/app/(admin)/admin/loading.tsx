export default function AdminLoading() {
  return (
    <div className="content wide">
      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .sk{ background:linear-gradient(90deg,#f0f2f5 25%,#e4e7eb 50%,#f0f2f5 75%); background-size:800px 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
      `}</style>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div>
          <div className="sk" style={{ height: 28, width: 200, marginBottom: 8 }} />
          <div className="sk" style={{ height: 16, width: 140 }} />
        </div>
        <div className="sk" style={{ height: 38, width: 130, borderRadius: 8 }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #eaecf0',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div className="sk" style={{ height: 120, marginBottom: 14, borderRadius: 8 }} />
            <div className="sk" style={{ height: 18, width: '70%', marginBottom: 8 }} />
            <div className="sk" style={{ height: 14, width: '50%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
