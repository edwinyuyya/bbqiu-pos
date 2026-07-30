'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PinGate from '../components/PinGate';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function durasi(sec) {
  sec = Number(sec) || 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function jamWIB(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

const STATUS_LABEL = { open: 'Diterima', preparing: 'Disiapkan', served: 'Disajikan' };

function SpvInner() {
  const [data, setData] = useState(null);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch('/api/spv/summary');
    const d = await r.json();
    setData(d);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const loadCalls = useCallback(async () => {
    const r = await fetch('/api/waiter-calls?status=pending');
    const d = await r.json();
    setCalls(d.calls || []);
  }, []);
  useEffect(() => {
    loadCalls();
    const t = setInterval(loadCalls, 5000);
    return () => clearInterval(t);
  }, [loadCalls]);

  async function handledCall(call) {
    await fetch(`/api/waiter-calls/${call.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'handled' }),
    });
    loadCalls();
  }

  return (
    <div className="container">
      <div className="between" style={{ padding: '16px 0' }}>
        <div>
          <h1 className="title">🧑‍💼 Dashboard SPV</h1>
          <p className="muted small">Pantauan operasional — order aktif, kinerja dapur, panggilan waiter, stok & rusak/susut. Tidak menampilkan HPP/harga beli/margin.</p>
        </div>
        <Link href="/" className="btn">← Beranda</Link>
      </div>

      {loading && <p className="muted">Memuat…</p>}
      {data && (
        <>
          {calls.length > 0 && (
            <div className="col" style={{ marginBottom: 14, gap: 8 }}>
              {calls.map((c) => (
                <div key={c.id} className="card" style={{ borderColor: 'var(--red)' }}>
                  <div className="between">
                    <div>
                      <span className="bold">🔔 Meja {c.table_number} memanggil</span>
                      {c.reason && <span className="muted small"> · {c.reason}</span>}
                    </div>
                    <button className="btn btn-green" onClick={() => handledCall(c)}>✅ Ditangani</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            <div className="card">
              <div className="h2" style={{ marginBottom: 10 }}>⏱️ Kinerja Dapur (hari ini)</div>
              {data.kitchen_perf.count === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>Belum ada order yang ditandai selesai.</p>
              ) : (
                <>
                  <div className="between"><span className="muted">Rata-rata (masuk → selesai)</span><span className="bold">{durasi(data.kitchen_perf.avg_duration_sec)}</span></div>
                  <div className="muted small" style={{ marginTop: 10, marginBottom: 6 }}>Order paling lama:</div>
                  <div className="col" style={{ gap: 6 }}>
                    {data.kitchen_perf.slowest.map((p, i) => (
                      <div key={i} className="between small">
                        <span>#{p.order_no} · Meja {p.table_number}</span>
                        <span className="bold">{durasi(p.duration_sec)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card" style={{ borderColor: data.low_stock.length ? 'var(--red)' : 'var(--line)' }}>
              <div className="h2" style={{ marginBottom: 10 }}>📦 Stok Menipis</div>
              {data.low_stock.length === 0 && <p className="muted small" style={{ margin: 0 }}>Semua stok aman ✓</p>}
              {data.low_stock.map((i) => (
                <div key={i.id} className="between" style={{ marginBottom: 6 }}>
                  <span>{i.name}</span>
                  <span className="badge badge-red">{Number(i.stock_qty)} {i.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">🗑️ Rusak/Susut (hari ini)</div>
              <span className="badge">{data.waste.length}×</span>
            </div>
            {data.waste.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>Tidak ada barang rusak/susut ✓</p>
            ) : (
              <div className="col" style={{ gap: 6 }}>
                {data.waste.map((w, i) => (
                  <div key={i} className="between small">
                    <span>{w.qty} {w.unit} {w.name} — {w.note}</span>
                    <span className="muted">{jamWIB(w.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">🧾 Order Aktif</div>
              <span className="badge">{data.orders.length}</span>
            </div>
            {data.orders.length === 0 && <p className="muted small" style={{ margin: 0 }}>Tidak ada order aktif.</p>}
            <div className="col" style={{ gap: 8 }}>
              {data.orders.map((o) => (
                <div key={o.id} className="between small" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                  <span>
                    <span className="bold">#{o.order_no}</span> · Meja {o.table_number}
                    <span className="muted"> · {STATUS_LABEL[o.status] || o.status}</span>
                  </span>
                  <span>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`} style={{ marginRight: 6 }}>
                      {o.payment_status === 'paid' ? 'Lunas' : 'Belum bayar'}
                    </span>
                    <span className="bold">{rupiah(o.total)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SpvPage() {
  return (
    <PinGate scope="spv" title="Masuk SPV">
      <SpvInner />
    </PinGate>
  );
}
