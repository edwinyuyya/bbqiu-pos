'use client';

import { useMemo, useState } from 'react';
import {
  TENGGAT_PANGGIL_MENIT,
  mejaCocok,
  menitSejak,
} from '../../lib/waitingList';

function jamWIB(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function lamaTeks(menit) {
  const m = Math.round(menit);
  if (m < 60) return `${m} menit`;
  return `${Math.floor(m / 60)} jam ${m % 60} menit`;
}

export default function AntrianTab({ antrian, tables, mejaTerpakai, reload }) {
  const [busy, setBusy] = useState('');
  const [pilihMeja, setPilihMeja] = useState({}); // { entriId: tableId }

  // Meja yang benar-benar bisa dipakai sekarang: aktif, tidak ada order open,
  // dan belum dijanjikan ke antrian lain yang sudah dipanggil.
  const mejaDijanjikan = useMemo(
    () => new Set(antrian.filter((a) => a.status === 'called' && a.table_id).map((a) => a.table_id)),
    [antrian]
  );

  const mejaKosong = useMemo(
    () => (tables || []).filter(
      (t) => t.active && !mejaTerpakai[t.id] && !mejaDijanjikan.has(t.id)
    ),
    [tables, mejaTerpakai, mejaDijanjikan]
  );

  async function ubah(entri, status, tableId) {
    setBusy(entri.id);
    try {
      await fetch(`/api/waiting-list/${entri.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, table_id: tableId || null }),
      });
      await reload();
    } finally {
      setBusy('');
    }
  }

  const menunggu = antrian.filter((a) => a.status === 'waiting');
  const dipanggil = antrian.filter((a) => a.status === 'called');

  return (
    <div className="col">
      <div className="between">
        <p className="muted small" style={{ margin: 0 }}>
          {menunggu.length} menunggu · {dipanggil.length} dipanggil · {mejaKosong.length} meja kosong
        </p>
      </div>

      {antrian.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada antrian hari ini.</p></div>
      )}

      {dipanggil.map((a) => {
        const lewat = menitSejak(a.called_at) > TENGGAT_PANGGIL_MENIT;
        const meja = tables.find((t) => t.id === a.table_id);
        return (
          <div key={a.id} className="card" style={{ borderColor: lewat ? 'var(--red)' : 'var(--green)' }}>
            <div className="between">
              <div>
                <span className="bold">#{a.queue_no} · {a.customer_name}</span>
                <div className="muted small">
                  {a.party_size} orang · Meja {meja?.table_number || '-'} · dipanggil {jamWIB(a.called_at)}
                </div>
              </div>
              <span className={`badge ${lewat ? 'badge-red' : 'badge-green'}`}>
                {lewat ? `Lewat ${lamaTeks(menitSejak(a.called_at))}` : 'Dipanggil'}
              </span>
            </div>
            <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-green" disabled={busy === a.id} onClick={() => ubah(a, 'seated')}>
                ✅ Sudah duduk
              </button>
              <button className="btn" disabled={busy === a.id} onClick={() => ubah(a, 'no_show')}>
                Tidak datang
              </button>
              <button className="btn" disabled={busy === a.id} onClick={() => ubah(a, 'waiting')}>
                ↩︎ Kembalikan ke antrian
              </button>
            </div>
          </div>
        );
      })}

      {menunggu.map((a, i) => {
        // Meja yang cocok DAN sedang kosong — inilah yang boleh ditawarkan.
        const cocok = mejaCocok(mejaKosong, {
          partySize: a.party_size, areaPref: a.area_pref,
        });
        const terpilih = pilihMeja[a.id] || cocok[0]?.id || '';
        return (
          <div key={a.id} className="card">
            <div className="between">
              <div>
                <span className="bold">#{a.queue_no} · {a.customer_name}</span>
                <div className="muted small">
                  {a.party_size} orang
                  {a.area_pref ? ` · minta ${a.area_pref}` : ' · area bebas'}
                  {' · '}menunggu {lamaTeks(menitSejak(a.created_at))}
                </div>
                {a.note && <div className="muted small">“{a.note}”</div>}
                {a.phone && <div className="muted small">{a.phone}</div>}
              </div>
              <span className="badge">{i === 0 ? 'Paling depan' : `Urutan ${i + 1}`}</span>
            </div>

            {cocok.length === 0 ? (
              <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
                Belum ada meja kosong yang muat {a.party_size} orang
                {a.area_pref ? ` di area ${a.area_pref}` : ''}.
              </p>
            ) : (
              <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                <select
                  className="select"
                  style={{ maxWidth: 220 }}
                  value={terpilih}
                  onChange={(e) => setPilihMeja((p) => ({ ...p, [a.id]: e.target.value }))}
                >
                  {cocok.map((t) => (
                    <option key={t.id} value={t.id}>
                      Meja {t.table_number}
                      {t.seats ? ` (${t.seats} kursi)` : ''}
                      {t.area ? ` · ${t.area}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-brand"
                  disabled={busy === a.id || !terpilih}
                  onClick={() => ubah(a, 'called', terpilih)}
                >
                  📣 Panggil
                </button>
                <button className="btn" disabled={busy === a.id} onClick={() => ubah(a, 'cancelled')}>
                  Batalkan
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
