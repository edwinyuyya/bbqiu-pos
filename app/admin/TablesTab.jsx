'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AREAS = ['Outdoor', 'Ruang AC', 'VIP'];

function randToken(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Dipakai bersama oleh /admin (full) dan /waiter (khusus meja & QR).
export default function TablesTab({ tables, origin, reload }) {
  const [num, setNum] = useState('');
  const [area, setArea] = useState('');
  const [busy, setBusy] = useState(false);

  async function addTable() {
    if (!num.trim()) return;
    setBusy(true);
    await supabase.from('tables').insert({
      table_number: num.trim(),
      token: randToken(`meja-${num.trim().toLowerCase()}`),
      area: area || null,
    });
    setNum(''); setArea('');
    await reload();
    setBusy(false);
  }

  const grouped = useMemo(() => {
    const byArea = {};
    for (const t of tables) (byArea[t.area || 'Tanpa area'] ||= []).push(t);
    return Object.entries(byArea);
  }, [tables]);
  async function toggle(t) {
    await supabase.from('tables').update({ active: !t.active }).eq('id', t.id);
    reload();
  }
  async function del(t) {
    if (!confirm(`Hapus meja ${t.table_number}?`)) return;
    await supabase.from('tables').delete().eq('id', t.id);
    reload();
  }

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Tambah Meja</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <input className="input" placeholder="Nomor / nama meja (mis. Outdoor 5)" value={num} onChange={(e) => setNum(e.target.value)} />
          <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">— Area (opsional) —</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn btn-brand" disabled={busy} onClick={addTable}>Tambah</button>
        </div>
      </div>

      {tables.length > 0 && (
        <Link href="/admin/qr" target="_blank" className="btn btn-brand btn-block no-print">
          🖨️ Cetak Semua QR Meja ({tables.length})
        </Link>
      )}

      {grouped.map(([areaName, list]) => (
        <div key={areaName} className="col">
          <div className="h2" style={{ marginTop: 8 }}>{areaName} <span className="muted small">({list.length} meja)</span></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
            {list.map((t) => {
              const link = `${origin}/menu/${t.token}`;
              return (
                <div key={t.id} className="card" style={{ textAlign: 'center' }}>
                  <div className="between">
                    <span className="bold">Meja {t.table_number}</span>
                    <span className={`badge ${t.active ? 'badge-green' : 'badge-red'}`}>{t.active ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  {origin && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/qr?size=220&data=${encodeURIComponent(link)}`}
                      alt={`QR meja ${t.table_number}`}
                      style={{ width: 180, height: 180, margin: '10px auto', background: '#fff', borderRadius: 10, padding: 6 }}
                    />
                  )}
                  <div className="muted small" style={{ wordBreak: 'break-all' }}>{link}</div>
                  <div className="row no-print" style={{ marginTop: 10, justifyContent: 'center' }}>
                    <Link href={`/admin/qr/${t.token}`} target="_blank" className="btn" style={{ padding: '6px 10px', fontSize: 13 }}>Cetak QR</Link>
                    <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => toggle(t)}>{t.active ? 'Nonaktif' : 'Aktif'}</button>
                    <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => del(t)}>Hapus</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
