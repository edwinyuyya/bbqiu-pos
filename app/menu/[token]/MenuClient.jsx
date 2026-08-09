'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CallWaiterButton from '../../components/CallWaiterButton';
import {
  COOK_METHODS,
  DRINK_TEMPS,
  SWEETNESS,
  cartKey,
  parseCartKey,
  variantLabels,
} from '../../../lib/variants';

function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

// mode='reservasi' -> halaman pra-pesan milik tamu reservasi. Bedanya:
// tidak ada tombol panggil waiter (mejanya belum tentu miliknya sekarang),
// tidak ada pilihan bayar (pelunasan dilakukan saat datang), dan setelah
// kirim tetap kembali ke halaman reservasinya.
export default function MenuClient({
  token, table, categories, items, taxPercent, merchant,
  mode = 'meja', headerExtra = null, judul = null,
}) {
  const reservasi = mode === 'reservasi';
  const router = useRouter();
  const [cart, setCart] = useState({}); // { cartKey: qty }
  const [notes, setNotes] = useState({}); // { cartKey: note }
  // Pilihan es/panas + mondo/manis/tawar yang sedang aktif per menu minuman.
  const [drinkOpt, setDrinkOpt] = useState({}); // { menuId: { temp, sweet } }
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [payment, setPayment] = useState('qris');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cari, setCari] = useState('');

  const itemById = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  );

  // Pencarian menu. Daftar menu sudah 121 item — menggulir sampai ketemu
  // terlalu lama, apalagi di HP.
  const hasilCari = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return items;
    // Ikut mencari di deskripsi, supaya "pedas" atau "jumbo" tetap ketemu
    // walau tidak ada di nama menunya.
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
    );
  }, [items, cari]);

  const grouped = useMemo(() => {
    const byCat = categories.map((c) => ({
      ...c,
      items: hasilCari.filter((i) => i.category_id === c.id),
    }));
    const uncategorized = hasilCari.filter(
      (i) => !categories.some((c) => c.id === i.category_id)
    );
    if (uncategorized.length)
      byCat.push({ id: 'none', name: 'Lainnya', items: uncategorized });
    return byCat.filter((c) => c.items.length);
  }, [categories, hasilCari]);

  const cartLines = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([key, qty]) => {
      const { menuId, method, temp, sweet } = parseCartKey(key);
      return { key, item: itemById[menuId], method, temp, sweet, qty, note: notes[key] || '' };
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
          payment_method: reservasi ? 'cashier' : payment,
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
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pesanan');
      if (reservasi) { router.refresh(); setShowCart(false); setCart({}); setNotes({}); setSubmitting(false); return; }
      router.push(`/order/${data.order_id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="cust-page">
    {!reservasi && <CallWaiterButton tableId={table.id} tableNumber={table.table_number} />}
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
        <h1 className="title">{judul || `Menu · Meja ${table.table_number}`}</h1>
      </header>

      {headerExtra && <div className="col" style={{ marginBottom: 14 }}>{headerExtra}</div>}

      {/* Pencarian menempel di atas supaya tetap terjangkau sambil menggulir */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--bg)', paddingTop: 4, paddingBottom: 10,
        }}
      >
        <input
          className="input"
          type="search"
          placeholder="Cari menu… (mis. karubi, teh, sate)"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
        {cari.trim() && (
          <div className="between" style={{ marginTop: 6 }}>
            <span className="muted small">{hasilCari.length} menu ditemukan</span>
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: 13 }}
              onClick={() => setCari('')}
            >
              Tampilkan semua
            </button>
          </div>
        )}
      </div>

      {cari.trim() && grouped.length === 0 && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Tidak ada menu yang cocok dengan “{cari}”. Coba kata lain, atau tekan
            “Tampilkan semua”.
          </p>
        </div>
      )}

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
              // Satu menu bisa punya beberapa baris keranjang (grill/steamboat,
              // atau es/panas × mondo/manis/tawar); sisa porsi dihitung dari totalnya.
              const myLines = Object.entries(cart).filter(
                ([k, q]) => q > 0 && parseCartKey(k).menuId === it.id
              );
              const totalInCart = myLines.reduce((s, [, q]) => s + q, 0);
              const atMax = limited && totalInCart >= remaining;
              // Minuman: pilihan suhu + tingkat manis yang sedang aktif di kartu ini.
              const opt = drinkOpt[it.id] || { temp: 'es', sweet: 'manis' };
              const drinkKey = cartKey(it.id, { temp: opt.temp, sweet: opt.sweet });
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
                  {!it.needs_cook_method && !it.needs_drink_option && (
                    <div className="qty">
                      {totalInCart > 0 && (
                        <>
                          <button onClick={() => setQty(cartKey(it.id), -1)}>−</button>
                          <span className="bold">{totalInCart}</span>
                        </>
                      )}
                      <button onClick={() => setQty(cartKey(it.id), 1)} disabled={atMax} style={atMax ? { opacity: 0.4 } : null}>+</button>
                    </div>
                  )}
                </div>

                {it.needs_cook_method && (
                  <div className="col" style={{ gap: 6, marginTop: 10 }}>
                    {COOK_METHODS.map((mth) => {
                      const key = cartKey(it.id, { method: mth.id });
                      const q = cart[key] || 0;
                      return (
                        <div key={mth.id} className="between">
                          <span className="small">{mth.emoji} {mth.label}</span>
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

                {it.needs_drink_option && (
                  <div className="col" style={{ gap: 8, marginTop: 10 }}>
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
                    </div>
                    <div className="opt-row">
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
                        {(cart[drinkKey] || 0) > 0 && (
                          <>
                            <button onClick={() => setQty(drinkKey, -1)}>−</button>
                            <span className="bold">{cart[drinkKey]}</span>
                          </>
                        )}
                        <button onClick={() => setQty(drinkKey, 1)} disabled={atMax} style={atMax ? { opacity: 0.4 } : null}>+</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kolom catatan per baris pesanan, muncul begitu item masuk keranjang */}
                {myLines.map(([key]) => {
                  const v = parseCartKey(key);
                  const labels = variantLabels({
                    cook_method: v.method, drink_temp: v.temp, sweetness: v.sweet,
                  });
                  return (
                    <input
                      key={key}
                      className="input"
                      style={{ marginTop: 8 }}
                      placeholder={
                        labels.length
                          ? `Catatan ${labels.join(' · ')} (mis. es sedikit)`
                          : 'Catatan (mis. tidak pedas)'
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
              {reservasi ? 'Lihat Pra-pesanan' : 'Lihat Keranjang'} · {totalQty} item · {rupiah(total)}
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
              <h2 className="h2">{reservasi ? 'Pra-pesanan' : `Keranjang · Meja ${table.table_number}`}</h2>
              <button className="btn" onClick={() => setShowCart(false)}>Tutup</button>
            </div>

            <div className="col">
              {cartLines.map((l) => (
                <div key={l.key} className="card">
                  <div className="between">
                    <div className="bold">
                      {l.item.name}
                      {variantLabels({
                        cook_method: l.method, drink_temp: l.temp, sweetness: l.sweet,
                      }).map((lab) => (
                        <span key={lab} className="badge badge-blue" style={{ marginLeft: 6 }}>
                          {lab}
                        </span>
                      ))}
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

            {reservasi && (
              <div className="card" style={{ marginTop: 12 }}>
                <p className="small muted" style={{ margin: 0 }}>
                  Pra-pesanan ini belum dikirim ke dapur. Pelunasan dilakukan
                  saat Anda tiba, dan masakan baru dibuat setelah itu supaya
                  sampai di meja dalam keadaan hangat.
                </p>
              </div>
            )}

            {!reservasi && (
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
            )}

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
              {submitting
                ? 'Memproses…'
                : reservasi
                  ? `Simpan Pra-pesanan · ${rupiah(total)}`
                  : `Pesan Sekarang · ${rupiah(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
