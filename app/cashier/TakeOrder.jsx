'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

// Kasir input order manual — untuk pelanggan yang tidak scan QR sendiri,
// atau tambahan order ke meja yang sudah jalan. Pakai endpoint POST /api/orders
// yang SAMA dengan yang dipakai halaman menu pelanggan (potong stok resep,
// hitung QRIS dinamis, dsb sudah otomatis ikut, tidak perlu logic baru).
export default function TakeOrder({ onCreated }) {
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [payment, setPayment] = useState('cashier');
  const [cart, setCart] = useState({}); // menu_item_id -> qty
  const [notes, setNotes] = useState({}); // menu_item_id -> note
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { order_id, order_no }

  useEffect(() => {
    (async () => {
      const [t, c, m] = await Promise.all([
        supabase.from('tables').select('id, table_number, token, active').eq('active', true).order('table_number'),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').eq('available', true).order('sort_order'),
      ]);
      setTables(t.data || []);
      setCategories(c.data || []);
      setMenuItems(m.data || []);
      setLoading(false);
    })();
  }, []);

  const itemById = useMemo(() => Object.fromEntries(menuItems.map((i) => [i.id, i])), [menuItems]);
  const grouped = useMemo(() => {
    const byCat = categories.map((c) => ({ ...c, items: menuItems.filter((i) => i.category_id === c.id) }));
    return byCat.filter((c) => c.items.length);
  }, [categories, menuItems]);

  const cartLines = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ item: itemById[id], qty, note: notes[id] || '' }))
    .filter((l) => l.item);
  const total = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);

  function setQty(id, delta) {
    setCart((c) => {
      const next = Math.max(0, (c[id] || 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id]; else copy[id] = next;
      return copy;
    });
  }

  function reset() {
    setCart({}); setNotes({}); setCustomerName(''); setTableId(''); setPayment('cashier'); setResult(null); setError('');
  }

  async function submit() {
    setError('');
    if (!tableId) { setError('Pilih meja dulu.'); return; }
    if (!cartLines.length) { setError('Belum ada menu dipilih.'); return; }
    const table = tables.find((t) => t.id === tableId);
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: table.token,
          customer_name: customerName,
          payment_method: payment,
          items: cartLines.map((l) => ({ menu_item_id: l.item.id, qty: l.qty, note: l.note })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat order');
      setResult({ order_id: data.order_id, order_no: data.order_no, table_number: table.table_number });
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  }

  if (loading) return <p className="muted">Memuat…</p>;

  if (result) {
    return (
      <div className="card" style={{ maxWidth: 480, borderColor: 'var(--green)' }}>
        <div className="h2" style={{ color: '#16794a' }}>✓ Order #{result.order_no} dibuat</div>
        <p className="muted small" style={{ marginTop: 6 }}>Meja {result.table_number} · Total {rupiah(total)}</p>
        <div className="col" style={{ gap: 8, marginTop: 10 }}>
          <Link href={`/order/${result.order_id}`} target="_blank" className="btn btn-brand btn-block">Buka Halaman Order (QRIS/status)</Link>
          <Link href={`/kitchen/print/${result.order_id}`} target="_blank" className="btn btn-block">🖨️ Struk Dapur</Link>
          <Link href={`/nota/${result.order_id}`} target="_blank" className="btn btn-block">🧾 Cetak Nota</Link>
          <button className="btn btn-block" onClick={() => { reset(); if (onCreated) onCreated(); }}>Selesai, kembali ke Bill</button>
          <button className="btn" onClick={reset}>+ Input order lain</button>
        </div>
      </div>
    );
  }

  return (
    <div className="col">
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="h2" style={{ marginBottom: 10 }}>Data Order</div>
        <div className="col" style={{ gap: 8 }}>
          <select className="select" value={tableId} onChange={(e) => setTableId(e.target.value)}>
            <option value="">— Pilih meja —</option>
            {tables.map((t) => <option key={t.id} value={t.id}>Meja {t.table_number}</option>)}
          </select>
          <input className="input" placeholder="Nama pelanggan (opsional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <div className="row">
            <label className={`btn ${payment === 'cashier' ? 'btn-brand' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
              <input type="radio" style={{ display: 'none' }} checked={payment === 'cashier'} onChange={() => setPayment('cashier')} />
              Bayar di Kasir
            </label>
            <label className={`btn ${payment === 'qris' ? 'btn-brand' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
              <input type="radio" style={{ display: 'none' }} checked={payment === 'qris'} onChange={() => setPayment('qris')} />
              QRIS
            </label>
          </div>
        </div>
      </div>

      {grouped.map((cat) => (
        <div key={cat.id} className="card">
          <div className="h2" style={{ marginBottom: 8 }}>{cat.name}</div>
          <div className="col" style={{ gap: 8 }}>
            {cat.items.map((it) => (
              <div key={it.id} className="between">
                <div style={{ flex: 1 }}>
                  <div className="bold">{it.name}</div>
                  <div className="muted small">{rupiah(it.price)}</div>
                </div>
                <div className="qty">
                  {cart[it.id] > 0 && (
                    <>
                      <button onClick={() => setQty(it.id, -1)}>−</button>
                      <span className="bold">{cart[it.id]}</span>
                    </>
                  )}
                  <button onClick={() => setQty(it.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {cartLines.length > 0 && (
        <div className="card" style={{ position: 'sticky', bottom: 10 }}>
          <div className="h2" style={{ marginBottom: 8 }}>Keranjang ({totalQty})</div>
          {cartLines.map((l) => (
            <div key={l.item.id} className="between small" style={{ marginBottom: 4 }}>
              <span>{l.qty}× {l.item.name}</span>
              <span>{rupiah(l.item.price * l.qty)}</span>
            </div>
          ))}
          <hr className="hr" />
          <div className="between bold"><span>Total</span><span>{rupiah(total)}</span></div>
          {error && <p className="small" style={{ color: '#ff8585', marginTop: 8 }}>{error}</p>}
          <button className="btn btn-brand btn-block" style={{ marginTop: 10 }} disabled={submitting} onClick={submit}>
            {submitting ? 'Memproses…' : `Buat Order · ${rupiah(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}
