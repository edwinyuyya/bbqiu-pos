'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

// Keterangan sisa porsi di bawah nama menu.
// daily_qty = batas porsi manual (mengunci order), stock_limit = hitungan dari
// stok bahan riil lewat resep. Yang paling kecil yang menentukan.
function sisaInfo(it, stokBelumDiinput) {
  const manual = it.daily_qty != null ? Number(it.daily_qty) : null;
  const stok = it.stock_limit != null ? Number(it.stock_limit) : null;

  if (manual != null && (stok == null || manual <= stok)) {
    return manual > 0
      ? { teks: `Sisa ${manual} porsi (batas harian)`, warna: 'amber' }
      : { teks: 'Batas harian habis', warna: 'red' };
  }
  // Kalau SEMUA menu berhitung nol, itu tandanya stok gudang memang belum
  // pernah diisi — bukan berarti bahannya benar-benar habis. Jangan bikin
  // seluruh layar merah untuk sesuatu yang cuma butuh input stok.
  if (stokBelumDiinput) {
    return { teks: 'Sisa porsi belum bisa dihitung — stok bahan belum diinput', warna: 'muted' };
  }
  if (stok != null) {
    return stok > 0
      ? { teks: `Sisa ± ${stok} porsi dari stok bahan`, warna: stok <= 5 ? 'amber' : 'muted' }
      : { teks: 'Stok bahan habis', warna: 'red' };
  }
  return { teks: 'Resep belum diisi, sisa porsi tidak bisa dihitung', warna: 'muted' };
}

const WARNA = {
  amber: { color: '#9a6b06' },
  red: { color: '#c0271f' },
  muted: null,
};

// Khusus Waiter: HANYA tandai menu habis/tersedia. Tidak ada edit nama/harga,
// tidak ada foto, tidak ada Resep/HPP/bahan — sengaja disembunyikan total.
export default function AvailabilityTab({ items, reload }) {
  const [cari, setCari] = useState('');

  async function toggle(it) {
    await supabase.from('menu_items').update({ available: !it.available }).eq('id', it.id);
    reload();
  }

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, cari]);

  // Semua menu berhitung nol = stok gudang belum diisi sama sekali.
  const stokBelumDiinput = useMemo(
    () => items.length > 0 && items.every((it) => it.stock_limit != null && Number(it.stock_limit) <= 0),
    [items]
  );

  return (
    <div className="col">
      <p className="muted small">Tandai menu yang sedang habis/kosong. Harga &amp; resep dikelola oleh Admin.</p>

      {stokBelumDiinput && (
        <div className="card" style={{ borderColor: 'var(--line)' }}>
          <p className="small" style={{ margin: 0 }}>
            Stok bahan di gudang belum diinput, jadi sisa porsi belum bisa dihitung otomatis.
            Isi dulu lewat menu <b>Stok</b> supaya angkanya muncul di sini.
          </p>
        </div>
      )}

      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', paddingBottom: 8 }}>
        <input
          className="input"
          type="search"
          placeholder="Cari menu… (mis. karubi, teh, sate)"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
        <div className="between" style={{ marginTop: 6 }}>
          <span className="muted small">
            {cari.trim() ? `${hasil.length} dari ${items.length} menu` : `${items.length} menu`}
          </span>
          {cari.trim() && (
            <button className="btn" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => setCari('')}>
              Hapus pencarian
            </button>
          )}
        </div>
      </div>

      {hasil.map((it) => {
        const sisa = sisaInfo(it, stokBelumDiinput);
        return (
          <div key={it.id} className="card">
            <div className="between">
              <div>
                <div>
                  <span className="bold">{it.name}</span> · {rupiah(it.price)}
                </div>
                <div className="small" style={{ marginTop: 3, ...(WARNA[sisa.warna] || {}) }}>
                  {sisa.teks}
                </div>
              </div>
              <span className={`badge ${it.available ? 'badge-green' : 'badge-red'}`}>
                {it.available ? 'Tersedia' : 'Habis'}
              </span>
            </div>
            <button
              className="btn btn-block"
              style={{ marginTop: 10 }}
              onClick={() => toggle(it)}
            >
              {it.available ? 'Tandai Habis' : 'Tandai Tersedia'}
            </button>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada menu.</p></div>
      )}
      {items.length > 0 && hasil.length === 0 && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Tidak ada menu yang cocok dengan “{cari}”.</p>
        </div>
      )}
    </div>
  );
}
