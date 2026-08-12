'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cocok } from '../../lib/cari';
import { urutkanMeja } from '../../lib/urutMeja';
import { bacaJson } from '../../lib/bacaJson';

// Pindah bill ke meja lain — tamu geser meja di tengah makan.
//
// Meja yang sudah punya bill hidup ditandai dan tidak bisa dipilih. Sistem
// memilih bill secara otomatis saat ada pesanan tambahan dari QR meja; dengan
// dua bill di satu meja, pilihannya jadi untung-untungan dan pesanan tamu bisa
// menempel ke tagihan orang lain.
export default function PindahMeja({ order, onTutup, onSelesai }) {
  const [tables, setTables] = useState([]);
  const [terpakai, setTerpakai] = useState({}); // table_id -> order_no
  const [cari, setCari] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [t, o] = await Promise.all([
        supabase.from('tables').select('id, table_number, area, seats').eq('active', true),
        supabase.from('orders').select('id, table_id, order_no')
          .in('status', ['open', 'preparing', 'served']),
      ]);
      setTables(t.data || []);
      const pakai = {};
      for (const row of o.data || []) {
        if (row.table_id && row.id !== order.id) pakai[row.table_id] = row.order_no;
      }
      setTerpakai(pakai);
    })();
  }, [order.id]);

  const daftar = useMemo(
    () => urutkanMeja(tables.filter((t) => t.id !== order.table_id && cocok([t.table_number, t.area], cari))),
    [tables, cari, order.table_id],
  );

  async function pindah(meja) {
    setError('');
    setBusy(true);
    try {
      const r = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: meja.id }),
      });
      const d = await bacaJson(r);
      if (!r.ok) throw new Error(d.error || 'Gagal memindahkan meja');
      onSelesai(meja);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="tirai" onClick={onTutup}>
      <div className="card kotak" onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <div>
            <div className="h2">🔀 Pindah Meja</div>
            <div className="muted small">
              Bill #{order.order_no} · sekarang di <b>Meja {order.table_number}</b>
            </div>
          </div>
          <button className="btn" onClick={onTutup}>✕</button>
        </div>

        <input
          className="input" style={{ marginTop: 10 }}
          placeholder="Cari meja tujuan…"
          value={cari} onChange={(e) => setCari(e.target.value)}
        />

        {error && <p className="small" style={{ color: '#c0271f', marginTop: 8 }}>{error}</p>}

        <div className="col" style={{ gap: 6, marginTop: 10 }}>
          {daftar.map((t) => {
            const isi = terpakai[t.id];
            return (
              <button
                key={t.id}
                className="btn btn-block"
                style={{ justifyContent: 'space-between', opacity: isi ? 0.5 : 1 }}
                disabled={busy || !!isi}
                onClick={() => pindah(t)}
              >
                <span>
                  Meja {t.table_number}
                  {t.area && <span className="muted small"> · {t.area}</span>}
                  {t.seats && <span className="muted small"> · {t.seats} kursi</span>}
                </span>
                {isi
                  ? <span className="badge badge-amber">terisi #{isi}</span>
                  : <span className="badge badge-green">kosong</span>}
              </button>
            );
          })}
          {daftar.length === 0 && (
            <p className="muted small" style={{ margin: 0 }}>Tidak ada meja yang cocok.</p>
          )}
        </div>

        <p className="muted small" style={{ marginTop: 10 }}>
          Seluruh isi tagihan ikut pindah. Struk dapur yang sudah tercetak tetap
          menulis meja lama — beri tahu dapur kalau makanannya belum keluar.
        </p>
      </div>
    </div>
  );
}
