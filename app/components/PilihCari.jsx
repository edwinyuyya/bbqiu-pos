'use client';

import { useMemo, useState } from 'react';
import { cocok } from '../../lib/cari';

// Dropdown yang bisa diketik. Menggantikan <select> untuk daftar panjang
// seperti daftar bahan (100+ baris) — menggulir <select> di layar HP untuk
// mencari satu bahan hampir tidak mungkin.
//
// options: [{ id, label, sub }]  sub = keterangan kecil (satuan, kategori)
export default function PilihCari({
  options, value, onChange,
  placeholder = 'Ketik untuk mencari…',
  kosong = 'Tidak ada yang cocok.',
  maks = 50,
  style,
}) {
  const [q, setQ] = useState('');
  const [buka, setBuka] = useState(false);

  const terpilih = (options || []).find((o) => o.id === value);

  const { list, lebih } = useMemo(() => {
    const semua = (options || []).filter((o) => cocok([o.label, o.sub], q));
    return { list: semua.slice(0, maks), lebih: Math.max(0, semua.length - maks) };
  }, [options, q, maks]);

  // Sudah memilih dan tidak sedang mencari: tampilkan pilihannya saja,
  // supaya tidak ada keraguan apa yang sedang terpilih.
  if (terpilih && !buka) {
    return (
      <div className="row" style={{ flexWrap: 'nowrap', ...style }}>
        <button
          className="btn"
          style={{ flex: 1, justifyContent: 'flex-start', textAlign: 'left' }}
          onClick={() => { setQ(''); setBuka(true); }}
          title="Klik untuk mengganti"
        >
          {terpilih.label}
          {terpilih.sub ? <span className="muted small">&nbsp;· {terpilih.sub}</span> : null}
        </button>
        <button className="btn" title="Kosongkan" onClick={() => { onChange(''); setQ(''); }}>✕</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        className="input"
        style={{ width: '100%' }}
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setBuka(true); }}
        onFocus={() => setBuka(true)}
        // Jeda singkat supaya klik pada daftar sempat terbaca sebelum menutup.
        onBlur={() => setTimeout(() => setBuka(false), 150)}
      />
      {buka && (
        <div
          className="card"
          style={{
            position: 'absolute', zIndex: 30, left: 0, right: 0, top: '100%',
            marginTop: 4, maxHeight: 280, overflowY: 'auto', padding: 6,
          }}
        >
          {list.length === 0 && (
            <p className="muted small" style={{ margin: 6 }}>{kosong}</p>
          )}
          {list.map((o) => (
            <button
              key={o.id}
              className="btn btn-block"
              style={{ justifyContent: 'flex-start', textAlign: 'left', marginBottom: 4 }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(o.id); setQ(''); setBuka(false); }}
            >
              {o.label}
              {o.sub ? <span className="muted small">&nbsp;· {o.sub}</span> : null}
            </button>
          ))}
          {lebih > 0 && (
            <p className="muted small" style={{ margin: 6 }}>
              +{lebih} lainnya — ketik lebih spesifik.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
