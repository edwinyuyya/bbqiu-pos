'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CallWaiterButton from '../../components/CallWaiterButton';

function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

export default function MenuClient({ token, table, categories, items, taxPercent, merchant }) {
  const router = useRouter();
  // Kunci keranjang = `${menuId}|${cookMethod}` supaya 1 menu bisa dipesan
  // sebagai Grill DAN Steamboat sekaligus sebagai baris terpisah.
  const [cart, setCart] = useState({}); // { "menuId|method": qty }
  const [notes, setNotes] = useState({}); // { "menuId|method": note }
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [payment, setPayment] = useState('qris');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const itemById = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  );

  const grouped = useMemo(() => {
    const byCat = categories.map((c) => ({
      ...c,
      items: items.filter((i) => i.category_id === c.id),
    }));
    const uncategorized = items.filter(
      (i) => !categories.some((c) => c.id === i.category_id)
    );
    if (uncategorized.length)
      byCat.push({ id: 'none', name: 'Lainnya', items: uncategorized });
    return byCat.filter((c) => c.items.length);
  }, [categories, items]);

  const cartLines = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([key, qty]) => {
      const [menuId, method] = key.split('|');
      return { key, item: itemById[menuId], method: method || null, qty, note: notes[key] || '' };
    })
    .filter((l) => l.item);

  const subtotal = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const tax = Math.round((subtotal * taxPercent) / 100);
  const total = subtotal + tax;
  const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);

  function setQty(key, delta) {
    setCart((c) => {
      const next = Math.max(0, (c[key] || 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  }

  async function submitOrder() {
    setError('');
    if (cartLines.length === 0) {
      setError('Keranjang masih kosong.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          customer_name: customerName,
          note: orderNote,
          payment_method: payment,
          items: cartLines.map((l) => ({
            menu_item_id: l.item.id,
            qty: l.qty,
            note: l.note,
            cook_method: l.method,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pesanan');
      router.push(`/order/${data.order_id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="cust-page">
    <CallWaiterButton tableId={table.id} tableNumber={table.table_number} />
    <div className="container-sm" style={{ paddingBottom: 90 }}>
      <div className="brand-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/bbqiu-logo.png" alt="BBQIU" />
        <div className="brand-tagline">Grill · Suki · Shao Kao</div>
        <div className="food-strip">
          <span className="food-chip"><span className="ic">🍢</span>Shao Kao</span>
          <span className="food-chip"><span className="ic">🍲</span>Steamboat</span>
          <span className="food-chip"><span className="ic">🥩</span>Grill Daging</span>
        </div>
        <div className="brand-divider" />
      </div>
      <header style={{ padding: '4px 0 12px' }}>
        <div className="muted small">{merchant}</div>
        <h1 className="title">Menu · Meja {table.table_number}</h1>
      </header>

      {grouped.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 18 }}>
          <h2 className="h2" style={{ marginBottom: 10 }}>{cat.name}</h2>
          <div className="col">
            {cat.items.map((it) => {
              // HANYA daily_qty (batas porsi manual) yang boleh memblokir order.
              // Sisa dari stok bahan sengaja cuma info: sistem resep memang
              // dikonfigurasi boleh minus, jadi stok bahan yang belum diinput
              // (0) tidak boleh bikin menu jadi tidak bisa dipesan.
              const limited = it.daily_qty != null;
              const remaining = limited ? Number(it.daily_qty) : null;
              const stockLeft = it.stock_limit != null && it.stock_limit > 0 ? Number(it.stock_limit) : null;
              // Menu Grill & Steamboat punya 2 baris qty terpisah (grill / steamboat);
              // sisa porsi dihitung dari total keduanya.
              const methods = it.needs_cook_method ? ['grill', 'steamboat'] : [null];
              const totalInCart = methods.reduce((s, mth) => s + (cart[`${it.id}|${mth || ''}`] || 0), 0);
              const atMax = limited && totalInCart >= remaining;
              return (
              <div key={it.id} className="card">
                <div className="between">
                  <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'flex-start' }}>
                    {it.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={it.name} style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div className="bold">{it.name}</div>
                      {it.description && (
                        <div className="muted small" style={{ marginTop: 2 }}>
                          {it.description}
                        </div>
                      )}
                      <div style={{ marginTop: 6 }}>{rupiah(it.price)}</div>
                      {limited && (
                        <div className="badge badge-amber" style={{ marginTop: 6 }}>
                          {remaining > 0 ? `sisa ${remaining} porsi` : 'habis'}
                        </div>
                      )}
                      {!limited && stockLeft != null && (
                        <div className="badge" style={{ marginTop: 6 }}>sisa {stockLeft}</div>
                      )}
                    </div>
                  </div>
                  {!it.needs_cook_method && (
                    <div className="qty">
                      {totalInCart > 0 && (
                        <>
                          <button onClick={() => setQty(`${it.id}|`, -1)}>−</button>
                          <span className="bold">{totalInCart}</span>
                        </>
                      )}
                      <button onClick={() => setQty(`${it.id}|`, 1)} disabled={atMax} style={atMax ? { opacity: 0.4 } : null}>+</button>
                    </div>
                  )}
                </div>

                {it.needs_cook_method && (
                  <div className="col" style={{ gap: 6, marginTop: 10 }}>
                    {[{ id: 'grill', label: '🔥 Grill' }, { id: 'steamboat', label: '🍲 Steamboat' }].map((mth) => {
                      const key = `${it.id}|${mth.id}`;
                      const q = cart[key] || 0;
                      return (
                        <div key={mth.id} className="between">
                          <span className="small">{mth.label}</span>
                          <div className="qty">
                            {q > 0 && (
                              <>
                                <button onClick={() => setQty(key, -1)}>−</button>
                                <span className="bold">{q}</span>
                              </>
                            )}
                            <button onClick={() => setQty(key, 1)} disabled={atMax} style={atMax ? { opacity: 0.4 } : null}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Bar keranjang melayang */}
      {totalQty > 0 && !showCart && (
        <div
          className="sticky-bottom"
          style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20 }}
        >
          <div className="container-sm" style={{ padding: '0 16px' }}>
            <button className="btn btn-brand btn-block" onClick={() => setShowCart(true)}>
              Lihat Keranjang · {totalQty} item · {rupiah(total)}
            </button>
          </div>
        </div>
      )}

      {/* Panel keranjang */}
      {showCart && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
            zIndex: 30, display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setShowCart(false)}
        >
          <div
            className="container-sm"
            style={{
              background: 'var(--bg)', borderTopLeftRadius: 18, borderTopRightRadius: 18,
              maxHeight: '88vh', overflowY: 'auto', width: '100%', paddingBottom: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="between" style={{ padding: '16px 0' }}>
              <h2 className="h2">Keranjang · Meja {table.table_number}</h2>
              <button className="btn" onClick={() => setShowCart(false)}>Tutup</button>
            </div>

            <div className="col">
              {cartLines.map((l) => (
                <div key={l.key} className="card">
                  <div className="between">
                    <div className="bold">
                      {l.item.name}
                      {l.method && (
                        <span className="badge badge-blue" style={{ marginLeft: 6 }}>
                          {l.method === 'grill' ? '🔥 Grill' : '🍲 Steamboat'}
                        </span>
                      )}
                    </div>
                    <div className="qty">
                      <button onClick={() => setQty(l.key, -1)}>−</button>
                      <span className="bold">{l.qty}</span>
                      <button onClick={() => setQty(l.key, 1)}>+</button>
                    </div>
                  </div>
                  <div className="between" style={{ marginTop: 6 }}>
                    <span className="muted small">
                      {rupiah(l.item.price)} × {l.qty}
                    </span>
                    <span className="bold">{rupiah(l.item.price * l.qty)}</span>
                  </div>
                  <input
                    className="input"
                    style={{ marginTop: 8 }}
                    placeholder="Catatan (mis. tidak pedas)"
                    value={notes[l.key] || ''}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [l.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="Nama (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <textarea
                className="textarea"
                style={{ marginTop: 8 }}
                placeholder="Catatan untuk seluruh pesanan (opsional)"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <div className="between"><span className="muted">Subtotal</span><span>{rupiah(subtotal)}</span></div>
              {taxPercent > 0 && (
                <div className="between" style={{ marginTop: 6 }}>
                  <span className="muted">PB1 {taxPercent}%</span><span>{rupiah(tax)}</span>
                </div>
              )}
              <hr className="hr" />
              <div className="between"><span className="bold">Total</span><span className="bold">{rupiah(total)}</span></div>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <div className="h2" style={{ marginBottom: 10 }}>Metode Pembayaran</div>
              <div className="col">
                <label className={`btn ${payment === 'qris' ? 'btn-brand' : ''}`} style={{ justifyContent: 'flex-start' }}>
                  <input type="radio" name="pay" checked={payment === 'qris'} onChange={() => setPayment('qris')} />
                  &nbsp;Bayar sekarang via QRIS
                </label>
                <label className={`btn ${payment === 'cashier' ? 'btn-brand' : ''}`} style={{ justifyContent: 'flex-start' }}>
                  <input type="radio" name="pay" checked={payment === 'cashier'} onChange={() => setPayment('cashier')} />
                  &nbsp;Bayar di kasir
                </label>
              </div>
            </div>

            {error && (
              <div className="card" style={{ marginTop: 12, borderColor: 'var(--red)' }}>
                <span style={{ color: '#ff8585' }}>{error}</span>
              </div>
            )}

            <button
              className="btn btn-green btn-block"
              style={{ marginTop: 14 }}
              disabled={submitting}
              onClick={submitOrder}
            >
              {submitting ? 'Memproses…' : `Pesan Sekarang · ${rupiah(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
