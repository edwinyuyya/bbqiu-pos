'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CariBox from '../components/CariBox';
import { cocok } from '../../lib/cari';

const AREAS = ['Outdoor', 'Ruang AC', 'VIP'];

function randToken(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Dipakai bersama oleh /admin (full) dan /waiter (khusus meja & QR).
export default function TablesTab({ tables, origin, reload }) {
  const [num, setNum] = useState('');
  const [area, setArea] = useState('');
  const [seats, setSeats] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  async function addTable() {
    if (!num.trim()) return;
    setBusy(true);
    await supabase.from('tables').insert({
      table_number: num.trim(),
      token: randToken(`meja-${num.trim().toLowerCase()}`),
      area: area || null,
      seats: seats === '' ? null : Math.max(1, parseInt(seats, 10) || 0) || null,
    });
    setNum(''); setArea(''); setSeats('');
    await reload();
    setBusy(false);
  }

  // Kapasitas kursi dipakai sistem antrian untuk mencocokkan rombongan
  // dengan meja. Disimpan begitu kolom kehilangan fokus.
  async function simpanSeats(t, nilai) {
    const angka = nilai === '' ? null : Math.max(1, parseInt(nilai, 10) || 0) || null;
    if (angka === (t.seats ?? null)) return;
    await supabase.from('tables').update({ seats: angka }).eq('id', t.id);
    reload();
  }

  const belumIsiKursi = tables.filter((t) => t.seats == null).length;

  const tersaring = useMemo(
    () => tables.filter((t) => cocok([t.table_number, t.area], q)),
    [tables, q],
  );
  const grouped = useMemo(() => {
    const byArea = {};
    for (const t of tersaring) (byArea[t.area || 'Tanpa area'] ||= []).push(t);
    return Object.entries(byArea);
  }, [tersaring]);
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
          <input
            className="input" style={{ maxWidth: 130 }} inputMode="numeric"
            placeholder="Kursi" value={seats} onChange={(e) => setSeats(e.target.value)}
          />
          <button className="btn btn-brand" disabled={busy} onClick={addTable}>Tambah</button>
        </div>
      </div>

      {belumIsiKursi > 0 && (
        <div className="card">
          <p className="small" style={{ margin: 0 }}>
            <b>{belumIsiKursi} meja belum diisi kapasitas kursinya.</b> Sistem antrian
            memakai angka ini untuk mencocokkan rombongan dengan meja — selama masih
            kosong, meja itu dianggap muat berapa pun orangnya. Isi di kolom “kursi”
            pada kartu meja di bawah.
          </p>
        </div>
      )}

      {tables.length > 0 && (
        <div className="row no-print" style={{ flexWrap: 'wrap' }}>
          <Link href="/admin/qr" target="_blank" className="btn btn-brand" style={{ flex: 1 }}>
            🖨️ Cetak Semua QR Meja ({tables.length})
          </Link>
          <Link href="/admin/qr-antri" target="_blank" className="btn" style={{ flex: 1 }}>
            📝 Cetak QR Antrian (pintu masuk)
          </Link>
        </div>
      )}

      <CariBox
        value={q} onChange={setQ}
        placeholder="Cari meja (nomor atau area)…"
        hasil={tersaring.length} total={tables.length}
      />

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
                  <div className="between no-print" style={{ marginTop: 8 }}>
                    <span className="muted small">Kapasitas kursi</span>
                    <input
                      className="input"
                      style={{ maxWidth: 90, textAlign: 'center', padding: '6px 8px' }}
                      inputMode="numeric"
                      placeholder="—"
                      defaultValue={t.seats ?? ''}
                      onBlur={(e) => simpanSeats(t, e.target.value)}
                    />
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
