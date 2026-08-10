'use client';

// Kolom pencarian untuk daftar panjang. Selalu tampilkan berapa yang cocok
// dari berapa total — tanpa itu, staf tidak tahu bedanya "tidak ada hasil"
// dengan "daftarnya memang kosong".
export default function CariBox({
  value, onChange, placeholder = 'Cari…', hasil, total, style,
}) {
  return (
    <div style={style}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button className="btn" title="Kosongkan" onClick={() => onChange('')}>✕</button>
        )}
      </div>
      {value && total != null && (
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          {hasil === 0 ? 'Tidak ada yang cocok' : `${hasil} dari ${total}`}
        </p>
      )}
    </div>
  );
}
