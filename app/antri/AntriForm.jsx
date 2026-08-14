'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KUNCI_HP = 'bbqiu_antri_device';
const KUNCI_ENTRI = 'bbqiu_antri_id';

// Penanda HP, supaya scan ulang QR yang sama tidak bikin nomor antrian baru.
function deviceKey() {
  let k = localStorage.getItem(KUNCI_HP);
  if (!k) {
    k = `hp-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    localStorage.setItem(KUNCI_HP, k);
  }
  return k;
}

export default function AntriForm({ merchant }) {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [orang, setOrang] = useState(2);
  const [hp, setHp] = useState('');
  const [catatan, setCatatan] = useState('');
  const [kirim, setKirim] = useState(false);
  const [error, setError] = useState('');
  const [cekLama, setCekLama] = useState(true);

  // Kalau HP ini masih punya antrian aktif, langsung lempar ke halaman status.
  useEffect(() => {
    const idLama = localStorage.getItem(KUNCI_ENTRI);
    if (!idLama) { setCekLama(false); return; }
    let batal = false;
    (async () => {
      try {
        const r = await fetch(`/api/waiting-list/${idLama}`);
        const d = await r.json();
        if (!batal && r.ok && ['waiting', 'called'].includes(d.entri?.status)) {
          router.replace(`/antri/${idLama}`);
          return;
        }
      } catch {}
      if (!batal) { localStorage.removeItem(KUNCI_ENTRI); setCekLama(false); }
    })();
    return () => { batal = true; };
  }, [router]);

  async function daftar() {
    setError('');
    if (!nama.trim()) { setError('Nama wajib diisi.'); return; }
    setKirim(true);
    try {
      const r = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: nama,
          party_size: orang,
          phone: hp,
          note: catatan,
          device_key: deviceKey(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal mendaftar antrian');
      localStorage.setItem(KUNCI_ENTRI, d.entri.id);
      router.replace(`/antri/${d.entri.id}`);
    } catch (e) {
      setError(e.message);
      setKirim(false);
    }
  }

  if (cekLama) {
    return <div className="card"><p className="muted" style={{ margin: 0 }}>Memeriksa…</p></div>;
  }

  return (
    <>
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Daftar Antrian</div>

        <label className="muted small">Nama</label>
        <input
          className="input" style={{ marginTop: 4 }} placeholder="Nama Anda"
          value={nama} onChange={(e) => setNama(e.target.value)}
        />

        <label className="muted small" style={{ display: 'block', marginTop: 12 }}>Jumlah orang</label>
        <div className="row" style={{ marginTop: 4, alignItems: 'center', gap: 12 }}>
          <div className="qty">
            <button onClick={() => setOrang((n) => Math.max(1, n - 1))}>−</button>
            <span className="bold" style={{ fontSize: 20, minWidth: 32, textAlign: 'center' }}>{orang}</span>
            <button onClick={() => setOrang((n) => Math.min(50, n + 1))}>+</button>
          </div>
          <span className="muted small">orang</span>
        </div>

        <label className="muted small" style={{ display: 'block', marginTop: 12 }}>
          No. WhatsApp (opsional)
        </label>
        <input
          className="input" style={{ marginTop: 4 }} inputMode="tel" placeholder="08…"
          value={hp} onChange={(e) => setHp(e.target.value)}
        />

        <input
          className="input" style={{ marginTop: 12 }}
          placeholder="Catatan (mis. bawa bayi, butuh kursi tinggi)"
          value={catatan} onChange={(e) => setCatatan(e.target.value)}
        />

        {error && <p className="small" style={{ color: '#ff8585', marginTop: 10 }}>{error}</p>}

        <button
          className="btn btn-brand btn-block" style={{ marginTop: 14 }}
          disabled={kirim} onClick={daftar}
        >
          {kirim ? 'Mendaftarkan…' : 'Ambil Nomor Antrian'}
        </button>
      </div>

      <div className="card">
        <p className="small muted" style={{ margin: 0 }}>
          Setelah daftar, Anda dapat halaman status yang bisa dipantau dari HP.
          Tidak perlu berdiri menunggu di depan — halaman itu akan berubah sendiri
          saat meja Anda siap.
        </p>
      </div>
    </>
  );
}
