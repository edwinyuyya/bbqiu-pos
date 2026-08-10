'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { taxPercent } from '../../lib/tax';
import { cocok } from '../../lib/cari';
import { urutkanMeja } from '../../lib/urutMeja';
import {
  COOK_METHODS,
  DRINK_TEMPS,
  SWEETNESS,
  cartKey,
  parseCartKey,
  variantLabels,
} from '../../lib/variants';

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
  const [cart, setCart] = useState({}); // cartKey -> qty
  const [notes, setNotes] = useState({}); // cartKey -> note
  // Pilihan es/panas + mondo/manis/tawar yang sedang aktif per menu minuman.
  const [drinkOpt, setDrinkOpt] = useState({}); // menuId -> { temp, sweet }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { order_id, order_no }
  const [cari, setCari] = useState('');

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

  // Pencarian menu. Menu sudah 121 item, menggulir kategori satu per satu
  // terlalu lambat saat kasir sedang antre.
  const cocokCari = useMemo(
    () => menuItems.filter((i) => cocok([i.name, i.description], cari)),
    [menuItems, cari],
  );

  const grouped = useMemo(() => {
    const byCat = categories.map((c) => ({ ...c, items: cocokCari.filter((i) => i.category_id === c.id) }));
    return byCat.filter((c) => c.items.length);
  }, [categories, cocokCari]);

  const cartLines = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([key, qty]) => {
      const { menuId, method, temp, sweet } = parseCartKey(key);
      return { key, item: itemById[menuId], method, temp, sweet, qty, note: notes[key] || '' };
    })
    .filter((l) => l.item);
  const subtotal = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const pb1 = taxPercent();
  const tax = Math.round((subtotal * pb1) / 100);
  const total = subtotal + tax;
  const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);

  function setQty(key, delta) {
    setCart((c) => {
      const next = Math.max(0, (c[key] || 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[key]; else copy[key] = next;
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
          items: cartLines.map((l) => ({
            menu_item_id: l.item.id,
            qty: l.qty,
            note: l.note,
            cook_method: l.method,
            drink_temp: l.temp,
            sweetness: l.sweet,
          })),
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
            {urutkanMeja(tables).map((t) => <option key={t.id} value={t.id}>Meja {t.table_number}</option>)}
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

      <div className="card" style={{ position: 'sticky', top: 0, zIndex: 6 }}>
        <input
          className="input"
          type="search"
          placeholder="Cari menu… (mis. karubi, teh, sate)"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
        <div className="between" style={{ marginTop: 6 }}>
          <span className="muted small">
            {cari.trim()
              ? `${cocokCari.length} dari ${menuItems.length} menu`
              : `${menuItems.length} menu`}
          </span>
          {cari.trim() && (
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: 13 }}
              onClick={() => setCari('')}
            >
              Hapus pencarian
            </button>
          )}
        </div>
      </div>

      {cari.trim() && grouped.length === 0 && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Tidak ada menu yang cocok dengan “{cari}”.</p>
        </div>
      )}

      {grouped.map((cat) => (
        <div key={cat.id} className="card">
          <div className="h2" style={{ marginBottom: 8 }}>{cat.name}</div>
          <div className="col" style={{ gap: 8 }}>
            {cat.items.map((it) => {
              const opt = drinkOpt[it.id] || { temp: 'es', sweet: 'manis' };
              const drinkKey = cartKey(it.id, { temp: opt.temp, sweet: opt.sweet });
              const myLines = Object.entries(cart).filter(
                ([k, q]) => q > 0 && parseCartKey(k).menuId === it.id
              );
              return (
              <div key={it.id}>
                <div className="between">
                  <div style={{ flex: 1 }}>
                    <div className="bold">{it.name}</div>
                    <div className="muted small">{rupiah(it.price)}</div>
                  </div>
                  {!it.needs_cook_method && !it.needs_drink_option && (
                    <div className="qty">
                      {cart[cartKey(it.id)] > 0 && (
                        <>
                          <button onClick={() => setQty(cartKey(it.id), -1)}>−</button>
                          <span className="bold">{cart[cartKey(it.id)]}</span>
                        </>
                      )}
                      <button onClick={() => setQty(cartKey(it.id), 1)}>+</button>
                    </div>
                  )}
                </div>
                {it.needs_cook_method && (
                  <div className="col" style={{ gap: 4, marginTop: 4, paddingLeft: 10 }}>
                    {COOK_METHODS.map((mth) => {
                      const key = cartKey(it.id, { method: mth.id });
                      return (
                        <div key={mth.id} className="between">
                          <span className="small muted">{mth.emoji} {mth.label}</span>
                          <div className="qty">
                            {cart[key] > 0 && (
                              <>
                                <button onClick={() => setQty(key, -1)}>−</button>
                                <span className="bold">{cart[key]}</span>
                              </>
                            )}
                            <button onClick={() => setQty(key, 1)}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {it.needs_drink_option && (
                  <div className="col" style={{ gap: 6, marginTop: 6, paddingLeft: 10 }}>
                    <div className="opt-row">
                      {DRINK_TEMPS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`chip ${opt.temp === t.id ? 'chip-on' : ''}`}
                          onClick={() => setDrinkOpt((d) => ({ ...d, [it.id]: { ...opt, temp: t.id } }))}
                        >
                          {t.emoji} {t.label}
                        </button>
                      ))}
                      {SWEETNESS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`chip ${opt.sweet === s.id ? 'chip-on' : ''}`}
                          onClick={() => setDrinkOpt((d) => ({ ...d, [it.id]: { ...opt, sweet: s.id } }))}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="between">
                      <span className="muted small">
                        Tambah: {DRINK_TEMPS.find((t) => t.id === opt.temp)?.label} ·{' '}
                        {SWEETNESS.find((s) => s.id === opt.sweet)?.label}
                      </span>
                      <div className="qty">
                        {cart[drinkKey] > 0 && (
                          <>
                            <button onClick={() => setQty(drinkKey, -1)}>−</button>
                            <span className="bold">{cart[drinkKey]}</span>
                          </>
                        )}
                        <button onClick={() => setQty(drinkKey, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Kolom catatan per baris pesanan */}
                {myLines.map(([key]) => {
                  const v = parseCartKey(key);
                  const labels = variantLabels({
                    cook_method: v.method, drink_temp: v.temp, sweetness: v.sweet,
                  });
                  return (
                    <input
                      key={key}
                      className="input"
                      style={{ marginTop: 6 }}
                      placeholder={
                        labels.length
                          ? `Catatan ${labels.join(' · ')}`
                          : 'Catatan (opsional)'
                      }
                      value={notes[key] || ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [key]: e.target.value }))}
                    />
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
      ))}

      {cartLines.length > 0 && (
        <div className="card" style={{ position: 'sticky', bottom: 10 }}>
          <div className="h2" style={{ marginBottom: 8 }}>Keranjang ({totalQty})</div>
          {cartLines.map((l) => (
            <div key={l.key} className="between small" style={{ marginBottom: 4 }}>
              <span>
                {l.qty}× {l.item.name}
                {variantLabels({
                  cook_method: l.method, drink_temp: l.temp, sweetness: l.sweet,
                }, { emoji: false }).map((lab) => (
                  <b key={lab}> [{lab}]</b>
                ))}
              </span>
              <span>{rupiah(l.item.price * l.qty)}</span>
            </div>
          ))}
          <hr className="hr" />
          <div className="between small"><span className="muted">Subtotal</span><span>{rupiah(subtotal)}</span></div>
          {pb1 > 0 && (
            <div className="between small"><span className="muted">PB1 {pb1}%</span><span>{rupiah(tax)}</span></div>
          )}
          <div className="between bold" style={{ marginTop: 4 }}><span>Total</span><span>{rupiah(total)}</span></div>
          {error && <p className="small" style={{ color: '#ff8585', marginTop: 8 }}>{error}</p>}
          <button className="btn btn-brand btn-block" style={{ marginTop: 10 }} disabled={submitting} onClick={submit}>
            {submitting ? 'Memproses…' : `Buat Order · ${rupiah(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}
