'use client';

import { useMemo, useState } from 'react';
import { STATUS, STATUS_LABEL, hariIniWIB, jamRapi, tanggalRapi } from '../../lib/reservation';
import { linkWA } from '../../lib/wa';

const MERCHANT = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'BBQIU';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

const KOSONG = {
  customer_name: '', phone: '', party_size: 2,
  reserved_date: '', reserved_time: '', table_id: '',
  deposit_amount: '', deposit_note: '', note: '', created_by: '',
};

export default function ReservasiTab({ reservations, tables, mejaTerpakai, reload, origin }) {
  const [form, setForm] = useState({ ...KOSONG, reserved_date: hariIniWIB() });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pilihMeja, setPilihMeja] = useState({});

  const tableById = useMemo(
    () => Object.fromEntries(tables.map((t) => [t.id, t])),
    [tables]
  );

  async function tambah() {
    setError('');
    if (!form.customer_name.trim()) return setError('Nama tamu wajib diisi.');
    if (!form.reserved_date) return setError('Tanggal wajib diisi.');
    setBusy('new');
    try {
      const r = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          party_size: Number(form.party_size) || 2,
          table_id: form.table_id || null,
          deposit_amount: Number(form.deposit_amount) || 0,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan');
      setForm({ ...KOSONG, reserved_date: hariIniWIB() });
      await reload();
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  }

  async function ubah(resv, patch) {
    setBusy(resv.id);
    try {
      const r = await fetch(`/api/reservations/${resv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal memperbarui');
      await reload();
    } catch (e) { alert(e.message); }
    finally { setBusy(''); }
  }

  async function hapus(resv) {
    if (!confirm(`Hapus reservasi ${resv.customer_name}?`)) return;
    setBusy(resv.id);
    await fetch(`/api/reservations/${resv.id}`, { method: 'DELETE' });
    await reload();
    setBusy('');
  }

  async function catatDP(resv) {
    const nilai = prompt(`DP diterima untuk ${resv.customer_name} (Rp):`, resv.deposit_amount || '');
    if (nilai === null) return;
    const cara = prompt('Cara bayar / keterangan DP:', resv.deposit_note || '') || '';
    ubah(resv, { deposit_amount: Number(nilai) || 0, deposit_note: cara });
  }

  const hariIni = hariIniWIB();

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Buat Reservasi</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <input className="input" style={{ maxWidth: 200 }} placeholder="Nama tamu"
            value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          <input className="input" style={{ maxWidth: 160 }} inputMode="tel" placeholder="No. WhatsApp"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" style={{ maxWidth: 110 }} inputMode="numeric" placeholder="Orang"
            value={form.party_size} onChange={(e) => setForm({ ...form, party_size: e.target.value })} />
        </div>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
          <input className="input" type="date" style={{ maxWidth: 180 }} min={hariIni}
            value={form.reserved_date} onChange={(e) => setForm({ ...form, reserved_date: e.target.value })} />
          <input className="input" type="time" style={{ maxWidth: 140 }}
            value={form.reserved_time} onChange={(e) => setForm({ ...form, reserved_time: e.target.value })} />
          <select className="select" style={{ maxWidth: 220 }} value={form.table_id}
            onChange={(e) => setForm({ ...form, table_id: e.target.value })}>
            <option value="">Meja: tentukan nanti</option>
            {tables.filter((t) => t.active).map((t) => (
              <option key={t.id} value={t.id}>
                Meja {t.table_number}{t.seats ? ` (${t.seats} kursi)` : ''}{t.area ? ` · ${t.area}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
          <input className="input" style={{ maxWidth: 170 }} inputMode="numeric" placeholder="DP diterima (Rp)"
            value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
          <input className="input" style={{ maxWidth: 200 }} placeholder="Keterangan DP"
            value={form.deposit_note} onChange={(e) => setForm({ ...form, deposit_note: e.target.value })} />
          <input className="input" placeholder="Catatan (mis. ulang tahun)"
            value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          Meja yang dipilih hanya <b>rencana</b> — tidak dikunci, jadi tamu lain
          tetap boleh memakainya sampai reservasi ini datang.
        </p>
        {error && <p className="small" style={{ color: '#ff8585' }}>{error}</p>}
        <button className="btn btn-brand btn-block" disabled={busy === 'new'} onClick={tambah}>
          {busy === 'new' ? 'Menyimpan…' : 'Buat Reservasi & Kirim Link'}
        </button>
      </div>

      {reservations.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada reservasi.</p></div>
      )}

      {reservations.map((r) => {
        const link = origin ? `${origin}/reservasi/${r.token}` : '';
        const meja = r.table_id ? tableById[r.table_id] : null;
        const pra = (r.orders || []).find((o) => o.status === 'scheduled');
        const total = Number(pra?.total || 0);
        const dp = Number(r.deposit_amount || 0);
        const sisa = Math.max(0, total - dp);
        const mejaTerpilih = pilihMeja[r.id] || r.table_id || '';
        const sedangDipakai = meja && mejaTerpakai[meja.id];
        const pesanWA =
          `Halo ${r.customer_name}, reservasi Anda di ${MERCHANT} sudah kami catat 🎉\n\n` +
          `Tanggal: ${tanggalRapi(r.reserved_date)}${r.reserved_time ? `\nJam: ${jamRapi(r.reserved_time)}` : ''}\n` +
          `Jumlah: ${r.party_size} orang${meja ? `\nMeja: ${meja.table_number}` : ''}\n` +
          (dp > 0 ? `DP diterima: ${rupiah(dp)}\n` : '') +
          `\nSilakan buka link ini untuk melihat detail dan memesan menu lebih awal:\n${link}\n\n` +
          `Sampai jumpa!`;

        return (
          <div key={r.id} className="card">
            <div className="between">
              <div>
                <span className="bold" style={{ fontSize: 17 }}>{r.customer_name}</span>
                <div className="muted small">
                  {tanggalRapi(r.reserved_date)}{r.reserved_time ? ` · ${jamRapi(r.reserved_time)}` : ''}
                  {' · '}{r.party_size} orang
                </div>
                {r.note && <div className="muted small">“{r.note}”</div>}
              </div>
              <span className={`badge ${r.status === STATUS.BOOKED ? 'badge-green' : r.status === STATUS.SEATED ? 'badge-blue' : 'badge-red'}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>

            <div className="small" style={{ marginTop: 8 }}>
              Meja rencana: <b>{meja ? meja.table_number : 'belum ditentukan'}</b>
              {sedangDipakai && (
                <span className="badge badge-amber" style={{ marginLeft: 6, fontSize: 10 }}>
                  sedang dipakai tamu lain
                </span>
              )}
            </div>

            {total > 0 && (
              <div className="small" style={{ marginTop: 6 }}>
                Pra-pesanan {rupiah(total)}
                {dp > 0 && <> · DP {rupiah(dp)} · <b>sisa {rupiah(sisa)}</b></>}
              </div>
            )}
            {total === 0 && dp > 0 && (
              <div className="small" style={{ marginTop: 6 }}>DP diterima {rupiah(dp)}</div>
            )}

            {r.status === STATUS.BOOKED && (
              <>
                <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="btn"
                      style={{ padding: '6px 10px', fontSize: 13 }}>🔗 Buka link</a>
                  )}
                  {linkWA(r.phone, pesanWA) && (
                    <a href={linkWA(r.phone, pesanWA)} target="_blank" rel="noopener noreferrer"
                      className="btn btn-green" style={{ padding: '6px 10px', fontSize: 13 }}>
                      💬 Kirim link via WA
                    </a>
                  )}
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }}
                    onClick={() => catatDP(r)}>💵 Catat DP</button>
                </div>

                <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                  <select className="select" style={{ maxWidth: 220 }} value={mejaTerpilih}
                    onChange={(e) => setPilihMeja((p) => ({ ...p, [r.id]: e.target.value }))}>
                    <option value="">— Pilih meja —</option>
                    {tables.filter((t) => t.active).map((t) => (
                      <option key={t.id} value={t.id}>
                        Meja {t.table_number}{t.seats ? ` (${t.seats})` : ''}
                        {mejaTerpakai[t.id] ? ' · terisi' : ''}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-brand" disabled={busy === r.id || !mejaTerpilih}
                    onClick={() => ubah(r, { status: STATUS.SEATED, table_id: mejaTerpilih })}>
                    ✅ Tamu datang
                  </button>
                  <button className="btn" disabled={busy === r.id}
                    onClick={() => ubah(r, { status: STATUS.NO_SHOW })}>Tidak datang</button>
                  <button className="btn" disabled={busy === r.id} onClick={() => hapus(r)}>Hapus</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
