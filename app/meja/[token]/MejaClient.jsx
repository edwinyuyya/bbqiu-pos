'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { variantLabels } from '../../../lib/variants';
import { bacaJson } from '../../../lib/bacaJson';

// Alasan siap-pakai supaya tamu yang buru-buru tidak perlu mengetik apa pun.
const ALASAN = ['Minta bantuan', 'Tambah pesanan', 'Minta air / sendok', 'Mau bayar'];

const STATUS_DAPUR = {
  queued: 'Menunggu diproses',
  printed: 'Sudah masuk dapur',
  preparing: 'Sedang dimasak',
  ready: 'Siap diantar',
  served: 'Sudah diantar',
};

export default function MejaClient({ table, merchant }) {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [gagal, setGagal] = useState('');
  const [pesan, setPesan] = useState('');
  const [kirim, setKirim] = useState(false);
  const [terkirim, setTerkirim] = useState('');

  const muat = useCallback(async () => {
    try {
      const r = await fetch(`/api/meja/${token}`);
      const d = await bacaJson(r);
      if (!r.ok) throw new Error(d.error || 'Gagal memuat pesanan');
      setData(d);
      setGagal('');
    } catch (e) {
      setGagal(e.message);
    }
  }, [token]);

  // Pesanan bertambah saat waiter/kasir memasukkan ronde berikutnya, jadi
  // layar ini menyegarkan sendiri — tamu tidak perlu menarik-narik halaman.
  useEffect(() => {
    muat();
    const t = setInterval(muat, 15000);
    return () => clearInterval(t);
  }, [muat]);

  async function panggil(alasan) {
    setKirim(true);
    try {
      const r = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: table.id,
          table_number: table.table_number,
          reason: alasan || null,
        }),
      });
      const d = await bacaJson(r);
      if (!r.ok) throw new Error(d.error || 'Gagal memanggil waiter');
      setTerkirim(d.already_pending
        ? 'Panggilan sebelumnya masih diproses — waiter sudah dalam perjalanan.'
        : 'Waiter sudah dipanggil. Mohon tunggu sebentar.');
      setPesan('');
      setTimeout(() => setTerkirim(''), 20000);
    } catch (e) {
      setGagal(e.message);
    }
    setKirim(false);
  }

  const items = data?.items || [];
  const totalPorsi = items.reduce((s, i) => s + Number(i.qty || 0), 0);

  return (
    <div className="cust-page">
      <div className="container-sm" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="muted small">{merchant}</div>
          <div className="title" style={{ fontSize: 34, margin: '2px 0' }}>
            Meja {table.table_number}
          </div>
          {data?.order && (
            <div className="muted small">Pesanan #{data.order.order_no}</div>
          )}
        </div>

        {/* ---------- 1. Panggil waiter ---------- */}
        <div className="card">
          <div className="h2" style={{ marginBottom: 4 }}>🔔 Panggil Waiter</div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Tekan salah satu tombol, atau tulis permintaan Anda di bawah.
          </p>

          <div className="col" style={{ gap: 6 }}>
            {ALASAN.map((a) => (
              <button
                key={a} className="btn btn-block" disabled={kirim}
                onClick={() => panggil(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <textarea
            className="textarea" style={{ marginTop: 10, minHeight: 70 }}
            placeholder="Pesan permintaan (mis. minta tambah arang, tisu, sambal)"
            value={pesan} maxLength={200}
            onChange={(e) => setPesan(e.target.value)}
          />
          <button
            className="btn btn-brand btn-block" style={{ marginTop: 8 }}
            disabled={kirim} onClick={() => panggil(pesan.trim())}
          >
            {kirim ? 'Mengirim…' : pesan.trim() ? 'Kirim Permintaan' : 'Panggil Saja'}
          </button>

          {terkirim && (
            <p className="small" style={{ marginTop: 10, color: '#8ef0b6' }}>✓ {terkirim}</p>
          )}
        </div>

        {/* ---------- 2. Daftar pesanan, tanpa harga ---------- */}
        <div className="card">
          <div className="between" style={{ marginBottom: 8 }}>
            <div className="h2">🍽️ Pesanan Anda</div>
            {totalPorsi > 0 && <span className="badge">{totalPorsi} porsi</span>}
          </div>

          {!data && !gagal && <p className="muted small" style={{ margin: 0 }}>Memuat…</p>}

          {data && !data.order && (
            <p className="muted small" style={{ margin: 0 }}>
              Belum ada pesanan tercatat untuk meja ini. Panggil waiter untuk memesan.
            </p>
          )}

          {items.map((it) => {
            const label = variantLabels(it, { emoji: false });
            return (
              <div key={it.id} style={{ borderBottom: '1px solid rgba(212,175,55,.2)', padding: '8px 0' }}>
                <div className="between">
                  <span className="bold">{it.name}</span>
                  <span className="bold">×{it.qty}</span>
                </div>
                {label.length > 0 && <div className="muted small">{label.join(' · ')}</div>}
                {it.note && <div className="muted small">“{it.note}”</div>}
                <div className="muted small">
                  {STATUS_DAPUR[it.kitchen_status] || 'Menunggu diproses'}
                </div>
              </div>
            );
          })}

          {items.length > 0 && (
            <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
              Daftar ini tanpa harga. Total tagihan diberikan kasir saat pembayaran.
            </p>
          )}
        </div>

        {gagal && (
          <div className="card">
            <p className="small" style={{ margin: 0, color: '#ffb4b4' }}>{gagal}</p>
          </div>
        )}
      </div>
    </div>
  );
}
