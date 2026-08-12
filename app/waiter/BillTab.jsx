'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import CariBox from '../components/CariBox';
import { cocok } from '../../lib/cari';
import { urutkanMeja } from '../../lib/urutMeja';
import { variantLabels } from '../../lib/variants';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function jamWIB(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

// Bill meja untuk waiter: melihat isi tagihan dan mencetak notanya di meja
// saat tamu minta bill.
//
// SENGAJA tanpa tombol Tandai Lunas, Tutup Bill, dan Batalkan. Menerima uang
// adalah pekerjaan kasir; kalau waiter bisa menandai lunas dari tabletnya,
// tidak ada lagi satu orang yang bertanggung jawab atas laci.
export default function BillTab() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState('');

  const muat = useCallback(async () => {
    const { data: ords } = await supabase
      .from('orders')
      .select('id, order_no, table_number, table_id, status, payment_status, total, created_at, customer_name')
      .in('status', ['open', 'preparing', 'served'])
      .order('created_at', { ascending: false })
      .limit(60);

    const ids = (ords || []).map((o) => o.id);
    let its = [];
    if (ids.length) {
      const r = await supabase
        .from('order_items')
        .select('id, order_id, name, qty, price, cook_method, drink_temp, sweetness, cancelled_at')
        .in('order_id', ids)
        .is('cancelled_at', null);
      its = r.data || [];
    }
    const per = {};
    for (const it of its) (per[it.order_id] ||= []).push(it);
    setItems(per);
    setOrders(ords || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    muat();
    const t = setInterval(muat, 10000);
    return () => clearInterval(t);
  }, [muat]);

  const tersaring = useMemo(() => {
    const hasil = orders.filter((o) => cocok([
      `#${o.order_no}`, String(o.order_no), o.table_number, o.customer_name,
      (items[o.id] || []).map((i) => i.name).join(' '),
    ], cari));
    // Diurutkan per nomor meja, bukan per waktu — waiter mencari berdasarkan
    // meja yang memanggilnya, bukan berdasarkan jam pesanan masuk.
    return urutkanMeja(hasil.map((o) => ({ ...o, table_number: o.table_number })));
  }, [orders, items, cari]);

  if (loading) return <p className="muted">Memuat…</p>;

  return (
    <div className="col">
      <div className="card" style={{ padding: '10px 12px' }}>
        <p className="muted small" style={{ margin: 0 }}>
          Untuk melihat tagihan meja dan mencetak notanya langsung di meja.
          Penerimaan uang tetap di kasir.
        </p>
      </div>

      <CariBox
        value={cari} onChange={setCari}
        placeholder="Cari meja, nama tamu, atau isi pesanan…"
        hasil={tersaring.length} total={orders.length}
      />

      {tersaring.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>
          {orders.length === 0 ? 'Belum ada meja yang jalan.' : 'Tidak ada yang cocok.'}
        </p></div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
        {tersaring.map((o) => {
          const lunas = o.payment_status === 'paid';
          const isi = items[o.id] || [];
          return (
            <div key={o.id} className="card">
              <div className="between">
                <div>
                  <div className="bold" style={{ fontSize: 17 }}>Meja {o.table_number}</div>
                  <div className="muted small">#{o.order_no} · masuk {jamWIB(o.created_at)}</div>
                </div>
                <span className={`badge ${lunas ? 'badge-green' : 'badge-amber'}`}>
                  {lunas ? 'Lunas' : 'Belum bayar'}
                </span>
              </div>

              {o.customer_name && <div className="muted small" style={{ marginTop: 4 }}>{o.customer_name}</div>}

              <hr className="hr" />
              <div className="col" style={{ gap: 3 }}>
                {isi.map((it) => (
                  <div key={it.id} className="between small">
                    <span>
                      {it.qty}× {it.name}
                      {variantLabels(it, { emoji: false }).map((lab) => (
                        <span key={lab} className="muted"> [{lab}]</span>
                      ))}
                    </span>
                    <span className="muted">{rupiah(it.price * it.qty)}</span>
                  </div>
                ))}
                {isi.length === 0 && (
                  <p className="muted small" style={{ margin: 0 }}>Belum ada item.</p>
                )}
              </div>

              <hr className="hr" />
              <div className="between bold" style={{ fontSize: 16 }}>
                <span>Total</span><span>{rupiah(o.total)}</span>
              </div>

              <Link href={`/nota/${o.id}`} target="_blank"
                className="btn btn-brand btn-block" style={{ marginTop: 10 }}>
                🧾 Cetak Nota
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
