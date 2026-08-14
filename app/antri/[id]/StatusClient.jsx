'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { estimasiTeks, TENGGAT_PANGGIL_MENIT } from '../../../lib/waitingList';

// Getar + bunyi saat meja siap. Bunyi cuma jalan kalau HP pernah disentuh
// di halaman ini (aturan browser), jadi getar dipakai sebagai cadangan.
function beriTahu() {
  try { navigator.vibrate?.([300, 120, 300, 120, 500]); } catch {}
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [880, 1046, 1318].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.22);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + i * 0.22 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.22 + 0.2);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.22);
      o.stop(ctx.currentTime + i * 0.22 + 0.25);
    });
  } catch {}
}

export default function StatusClient({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const statusLama = useRef(null);

  const muat = useCallback(async () => {
    try {
      const r = await fetch(`/api/waiting-list/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal memuat status');
      setData(d);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    muat();
    const t = setInterval(muat, 10000);
    return () => clearInterval(t);
  }, [muat]);

  // Bunyikan sekali saat status berubah jadi "dipanggil".
  useEffect(() => {
    const st = data?.entri?.status;
    if (!st) return;
    if (statusLama.current === 'waiting' && st === 'called') beriTahu();
    statusLama.current = st;
  }, [data]);

  async function batal() {
    if (!confirm('Batalkan antrian Anda?')) return;
    await fetch(`/api/waiting-list/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    muat();
  }

  if (error && !data) {
    return (
      <div className="card">
        <p style={{ color: '#ff8585', margin: 0 }}>{error}</p>
        <Link href="/antri" className="btn btn-block" style={{ marginTop: 12 }}>Daftar antrian baru</Link>
      </div>
    );
  }
  if (!data) return <div className="card"><p className="muted" style={{ margin: 0 }}>Memuat…</p></div>;

  const { entri, meja, posisi, estimasi_menit } = data;

  if (entri.status === 'called') {
    return (
      <>
        <div className="card" style={{ borderColor: 'var(--green)', textAlign: 'center' }}>
          <div className="badge badge-green" style={{ marginBottom: 10 }}>Antrian #{entri.queue_no}</div>
          <div className="title" style={{ fontSize: 26, marginBottom: 6 }}>MEJA ANDA SIAP</div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>
            Meja {meja?.table_number || '-'}
          </div>
          {meja?.area && <div className="muted" style={{ marginTop: 4 }}>{meja.area}</div>}
          <p className="small" style={{ marginTop: 14, marginBottom: 0 }}>
            Silakan langsung menuju meja. Tunjukkan layar ini ke staf kami.
            Mohon datang dalam {TENGGAT_PANGGIL_MENIT} menit ya.
          </p>
        </div>
        <div className="card">
          <div className="muted small">Atas nama</div>
          <div className="bold">{entri.customer_name} · {entri.party_size} orang</div>
        </div>
      </>
    );
  }

  if (entri.status !== 'waiting') {
    const pesan = {
      seated: 'Anda sudah duduk. Selamat menikmati!',
      no_show: 'Antrian Anda dilewati karena tidak datang saat dipanggil.',
      cancelled: 'Antrian Anda sudah dibatalkan.',
    }[entri.status] || 'Antrian sudah selesai.';
    return (
      <div className="card">
        <div className="badge" style={{ marginBottom: 8 }}>Antrian #{entri.queue_no}</div>
        <p style={{ margin: 0 }}>{pesan}</p>
        {entri.status !== 'seated' && (
          <Link href="/antri" className="btn btn-brand btn-block" style={{ marginTop: 12 }}>
            Daftar antrian baru
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="muted small">Nomor antrian Anda</div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: '4px 0' }}>
          #{entri.queue_no}
        </div>
        <div className="bold">{entri.customer_name} · {entri.party_size} orang</div>
      </div>

      <div className="card">
        <div className="between">
          <span className="muted">Di depan Anda</span>
          <span className="bold">
            {posisi == null ? '—' : posisi <= 1 ? 'Anda berikutnya' : `${posisi - 1} grup`}
          </span>
        </div>
        <hr className="hr" />
        <div className="between">
          <span className="muted">Perkiraan menunggu</span>
          <span className="bold">{estimasiTeks(estimasi_menit)}</span>
        </div>
        <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
          Perkiraan bisa berubah tergantung kondisi meja. Halaman ini memperbarui
          sendiri — biarkan terbuka, nanti berubah otomatis saat meja Anda siap.
        </p>
      </div>

      <button className="btn btn-block" onClick={batal}>Batalkan antrian</button>
    </>
  );
}
