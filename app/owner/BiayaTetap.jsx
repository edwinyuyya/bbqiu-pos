'use client';

import { useCallback, useEffect, useState } from 'react';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

// Biaya tetap bulanan: gaji, sewa, langganan.
// Dikelola di halaman Owner karena angkanya sensitif — kasir hanya melihat
// total bebannya per hari, tanpa rincian gaji per orang.
export default function BiayaTetap() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ name: '', amount_monthly: '', note: '' });
  const [hariBuka, setHariBuka] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [buka, setBuka] = useState(false);

  const muat = useCallback(async () => {
    const r = await fetch('/api/fixed-costs');
    const d = await r.json();
    setData(d);
    setHariBuka(String(d.hari_buka_per_bulan ?? 30));
  }, []);
  useEffect(() => { muat(); }, [muat]);

  async function tambah() {
    setError('');
    if (!form.name.trim()) return setError('Nama biaya wajib diisi.');
    if (!(Number(form.amount_monthly) > 0)) return setError('Nominal per bulan wajib diisi.');
    setBusy(true);
    try {
      const r = await fetch('/api/fixed-costs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount_monthly: Number(form.amount_monthly) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan');
      setForm({ name: '', amount_monthly: '', note: '' });
      await muat();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function simpanHariBuka() {
    setBusy(true);
    await fetch('/api/fixed-costs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hari_buka_per_bulan: Number(hariBuka) }),
    });
    await muat();
    setBusy(false);
  }

  async function toggle(c) {
    await fetch('/api/fixed-costs', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    muat();
  }
  async function hapus(c) {
    if (!confirm(`Hapus biaya "${c.name}"?`)) return;
    await fetch(`/api/fixed-costs?id=${c.id}`, { method: 'DELETE' });
    muat();
  }

  if (!data) return null;

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="between">
        <div>
          <div className="h2">⚙️ Biaya Tetap Bulanan</div>
          <div className="muted small" style={{ marginTop: 2 }}>
            {rupiah(data.total_bulanan)}/bulan ÷ {data.hari_buka_per_bulan} hari buka ={' '}
            <b>{rupiah(data.per_hari)}/hari</b>
          </div>
        </div>
        <button className="btn" onClick={() => setBuka((b) => !b)}>
          {buka ? 'Tutup' : 'Kelola'}
        </button>
      </div>

      {buka && (
        <>
          <hr className="hr" />

          <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="muted small">Jumlah hari buka per bulan
              <input className="input" style={{ maxWidth: 120 }} inputMode="numeric"
                value={hariBuka} onChange={(e) => setHariBuka(e.target.value)} />
            </label>
            <button className="btn" disabled={busy} onClick={simpanHariBuka}>Simpan</button>
          </div>
          <p className="muted small" style={{ marginTop: 4 }}>
            Dipakai membagi biaya bulanan jadi beban harian. Kalau libur seminggu
            sekali, isi 26.
          </p>

          <hr className="hr" />

          <div className="col" style={{ gap: 6 }}>
            {(data.costs || []).length === 0 && (
              <p className="muted small" style={{ margin: 0 }}>Belum ada biaya tetap.</p>
            )}
            {(data.costs || []).map((c) => (
              <div key={c.id} className="between" style={{ opacity: c.active ? 1 : 0.5 }}>
                <span>
                  {c.name}
                  {!c.active && <span className="badge" style={{ marginLeft: 6 }}>nonaktif</span>}
                  {c.note && <div className="muted small">{c.note}</div>}
                </span>
                <span>
                  <b>{rupiah(c.amount_monthly)}</b>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: 12, marginLeft: 8 }}
                    onClick={() => toggle(c)}>{c.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: 12, marginLeft: 4 }}
                    onClick={() => hapus(c)}>Hapus</button>
                </span>
              </div>
            ))}
          </div>

          <hr className="hr" />

          <div className="row" style={{ flexWrap: 'wrap' }}>
            <input className="input" style={{ flex: 2, minWidth: 160 }}
              placeholder="Nama (mis. Gaji koki, Sewa tempat)"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" style={{ maxWidth: 160 }} inputMode="numeric"
              placeholder="Rp per bulan"
              value={form.amount_monthly} onChange={(e) => setForm({ ...form, amount_monthly: e.target.value })} />
            <button className="btn btn-brand" disabled={busy} onClick={tambah}>Tambah</button>
          </div>
          {error && <p className="small" style={{ color: '#ff8585', marginTop: 6 }}>{error}</p>}

          <p className="muted small" style={{ marginTop: 10 }}>
            Kasir hanya melihat <b>total</b> beban harian, bukan rincian gaji per orang.
          </p>
        </>
      )}
    </div>
  );
}
