'use client';

import { useState } from 'react';

const REASONS = ['Butuh bantuan', 'Tambah pesanan', 'Minta air/sendok', 'Mau bayar'];

// Tombol panggil waiter untuk halaman pelanggan (menu & status order).
// Sengaja fixed di pojok supaya tidak menutupi tombol keranjang/checkout.
export default function CallWaiterButton({ tableId, tableNumber }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function call(reason) {
    setBusy(true);
    try {
      const res = await fetch('/api/waiter-calls', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId, table_number: tableNumber, reason }),
      });
      if (res.ok) { setSent(true); setOpen(false); setTimeout(() => setSent(false), 60000); }
    } catch {}
    setBusy(false);
  }

  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 40 }}>
      {!open && (
        <button
          className="btn btn-brand"
          style={{ borderRadius: 999, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}
          onClick={() => setOpen(true)}
          disabled={sent}
        >
          {sent ? '✓ Waiter dipanggil' : '🔔 Panggil Waiter'}
        </button>
      )}
      {open && (
        <div className="card" style={{ width: 220, boxShadow: '0 6px 20px rgba(0,0,0,.35)' }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <span className="bold small">Butuh apa?</span>
            <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="col" style={{ gap: 6 }}>
            {REASONS.map((r) => (
              <button key={r} className="btn" style={{ fontSize: 13, textAlign: 'left', justifyContent: 'flex-start' }} disabled={busy} onClick={() => call(r)}>
                {r}
              </button>
            ))}
            <button className="btn btn-brand" style={{ fontSize: 13 }} disabled={busy} onClick={() => call(null)}>
              {busy ? 'Memanggil…' : 'Panggil saja'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
