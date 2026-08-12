'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import PinGate from '../components/PinGate';
import FaceCapture from '../components/FaceCapture';
import CariBox from '../components/CariBox';
import TakeOrder from './TakeOrder';
import PindahMeja from './PindahMeja';
import OmzetTab from './OmzetTab';
import { WAJIB_BAYAR_DULU } from '../../lib/orderFlow';
import { cocok } from '../../lib/cari';

// Bunyi "ding-dong" pendek pakai Web Audio API (tanpa file audio eksternal).
function beep(ctx) {
  // Browser (terutama tablet/Android) sering auto-suspend AudioContext
  // kalau tab lama tidak ada interaksi — resume dulu supaya tetap bunyi.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const tone = (freq, start, dur) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + start);
    o.stop(ctx.currentTime + start + dur + 0.05);
  };
  tone(880, 0, 0.16);
  tone(1046, 0.18, 0.2);
}

function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}
function jamWIB(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
function tanggalWIB(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}
// Tanggal nota. "Hari ini"/"Kemarin" dibedakan karena itu yang paling sering
// ditanyakan; nota lebih lama ditulis tanggalnya lengkap supaya tidak keliru
// saat mencocokkan dengan setoran.
function tanggalNota(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const jam = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
    const tgl = tanggalWIB(iso);
    const hariIni = tanggalWIB(Date.now());
    const kemarin = tanggalWIB(Date.now() - 86400000);
    if (tgl === hariIni) return `Hari ini ${jam}`;
    if (tgl === kemarin) return `Kemarin ${jam}`;
    return `${d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })} · ${jam}`;
  } catch { return ''; }
}
// Kompres foto nota (dari file/kamera) jadi data URL kecil.
function compressReceipt(file, maxW = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxW / (img.width || maxW));
        const w = Math.round((img.width || maxW) * scale);
        const h = Math.round((img.height || maxW) * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function CashierPage() {
  const [mainTab, setMainTab] = useState('bill'); // bill | pettycash
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState({});
  const [tab, setTab] = useState('active'); // active | closed
  const [cariBill, setCariBill] = useState('');
  // Bill yang sedang ditambahi pesanan dari tab Input Order.
  const [tambahKe, setTambahKe] = useState(null); // { table_id, order_no, table_number }
  const [pindah, setPindah] = useState(null);    // bill yang sedang dipindah mejanya
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [cap, setCap] = useState(null); // { mode:'void'|'close', title, onPhoto }
  const [kodePromo, setKodePromo] = useState({}); // order_id -> kode yang diketik
  const [calls, setCalls] = useState([]);
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef(null);
  const seenCallIds = useRef(null);

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

  // Alert suara saat ada panggilan waiter baru (pola sama dengan Kitchen Display/Waiter).
  useEffect(() => {
    // Jaga-jaga: browser bisa auto-suspend AudioContext kalau tab lama idle.
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    const currentIds = new Set(calls.map((c) => c.id));
    if (seenCallIds.current === null) { seenCallIds.current = currentIds; return; }
    const newOnes = calls.filter((c) => !seenCallIds.current.has(c.id));
    seenCallIds.current = currentIds;
    if (!newOnes.length) return;
    if (soundOn && audioCtxRef.current) {
      beep(audioCtxRef.current);
      const t = `Meja ${newOnes[0].table_number} memanggil`;
      speak(`${t}. ${t}.`);
    }
  }, [calls, soundOn]);

  function enableSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
      beep(audioCtxRef.current);
      speak('Suara aktif');
      setSoundOn(true);
    } catch {}
  }

  async function handledCall(call) {
    await fetch(`/api/waiter-calls/${call.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'handled' }),
    });
    loadCalls();
  }

  const load = useCallback(async () => {
    const statuses = tab === 'active'
      ? ['open', 'preparing', 'served']
      : ['closed', 'cancelled'];
    const { data: ords } = await supabase
      .from('orders')
      .select('*')
      .in('status', statuses)
      .order('created_at', { ascending: false })
      .limit(50);

    const ids = (ords || []).map((o) => o.id);
    let its = [];
    if (ids.length) {
      const r = await supabase.from('order_items').select('*').in('order_id', ids);
      its = r.data || [];
    }
    const byOrder = {};
    for (const it of its) (byOrder[it.order_id] ||= []).push(it);
    setItems(byOrder);
    setOrders(ords || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  async function patch(id, body) {
    setBusy(id);
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await load();
    setBusy('');
  }

  async function pasangPromo(o) {
    const code = (kodePromo[o.id] || '').trim();
    if (!code) return;
    setBusy(o.id);
    try {
      const r = await fetch(`/api/orders/${o.id}/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Kode tidak berlaku');
      setKodePromo((k) => ({ ...k, [o.id]: '' }));
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy('');
    }
  }

  async function lepasPromo(o) {
    setBusy(o.id);
    try {
      const r = await fetch(`/api/orders/${o.id}/promo`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal melepas kode');
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy('');
    }
  }

  // Batalkan SATU item (mis. bahannya habis) tanpa membatalkan seluruh bill.
  // Cukup alasan + nama petugas, tanpa foto — bobotnya jauh lebih kecil
  // daripada void bill, tapi tetap dicatat & dikabarkan ke pemilik.
  async function batalkanItem(o, it) {
    const reason = prompt(
      `Batalkan item:\n${it.qty}× ${it.name} (${rupiah(it.price * it.qty)})\n\n` +
      `Alasan (mis. bahan habis):`
    );
    if (reason === null) return;
    if (!reason.trim()) { alert('Alasan wajib diisi.'); return; }
    const by = prompt('Nama/inisial petugas:') || '';

    setBusy(o.id);
    try {
      const r = await fetch(`/api/order-items/${it.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim(), by: by.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal membatalkan item');
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy('');
    }
  }

  // Void/batalkan bill: wajib isi alasan + nama petugas + FOTO WAJAH (anti-curang)
  async function voidBill(o) {
    const reason = prompt(`Batalkan bill #${o.order_no} (Meja ${o.table_number}, ${rupiah(o.total)}).\n\nAlasan pembatalan:`);
    if (reason === null) return; // batal
    if (!reason.trim()) { alert('Alasan wajib diisi.'); return; }
    const by = prompt('Nama/inisial petugas yang membatalkan:') || '';
    // buka kamera; setelah foto diambil, baru proses pembatalan
    setCap({
      mode: 'void',
      title: 'Foto Wajah — Pembatalan',
      onPhoto: async (photo) => {
        await patch(o.id, { status: 'cancelled', void_reason: reason.trim(), voided_by: by.trim(), void_photo: photo });
      },
    });
  }

  // Tutup kasir / akhir shift: wajib foto wajah + hitung kas (untuk pantauan owner)
  async function closeShift() {
    const by = prompt('Nama/inisial kasir yang menutup shift:') || '';
    if (!by.trim()) { alert('Nama kasir wajib diisi.'); return; }
    const cashStr = prompt('Total uang kas di laci (Rp), kosongkan jika tidak dihitung:') || '';
    const note = prompt('Catatan (opsional):') || '';
    setCap({
      mode: 'close',
      title: 'Foto Wajah — Tutup Kasir',
      onPhoto: async (photo) => {
        setBusy('close');
        await fetch('/api/cashier/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            closed_by: by.trim(),
            cash_total: cashStr.replace(/[^0-9]/g, '') || null,
            note: note.trim(),
            photo,
          }),
        });
        setBusy('');
        alert('Kasir berhasil ditutup. Tercatat di Dashboard Owner.');
      },
    });
  }

  async function onPhotoTaken(photo) {
    const fn = cap?.onPhoto;
    setCap(null);
    if (fn) await fn(photo);
  }

  // Nomor nota, meja, nama pemesan, dan isi pesanannya — tamu biasanya ingat
  // salah satu dari itu, bukan nomor notanya.
  const billTersaring = useMemo(() => orders.filter((o) => cocok([
    `#${o.order_no}`, String(o.order_no), o.table_number, o.customer_name,
    (items[o.id] || []).map((it) => it.name).join(' '),
  ], cariBill)), [orders, items, cariBill]);

  return (
    <div className="container">
      <div className="between" style={{ padding: '16px 0' }}>
        <div>
          <h1 className="title">💵 Kasir</h1>
          <p className="muted small">Konfirmasi pembayaran &amp; tutup bill</p>
        </div>
        <div className="row">
          <button className={`btn ${soundOn ? 'btn-green' : 'btn-brand'}`} onClick={enableSound}>
            {soundOn ? '🔊 Suara Aktif' : '🔔 Aktifkan Suara'}
          </button>
          <button className="btn" disabled={busy === 'close'} onClick={closeShift}>🔒 Tutup Kasir</button>
          <Link href="/" className="btn">← Beranda</Link>
        </div>
      </div>

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

      <div className="row" style={{ marginBottom: 14 }}>
        <button className={`btn ${mainTab === 'bill' ? 'btn-brand' : ''}`} onClick={() => setMainTab('bill')}>🧾 Bill</button>
        <button className={`btn ${mainTab === 'takeorder' ? 'btn-brand' : ''}`}
          onClick={() => { setTambahKe(null); setMainTab('takeorder'); }}>➕ Input Order</button>
        <button className={`btn ${mainTab === 'omzet' ? 'btn-brand' : ''}`} onClick={() => setMainTab('omzet')}>📊 Omzet &amp; Biaya</button>
        <button className={`btn ${mainTab === 'pettycash' ? 'btn-brand' : ''}`} onClick={() => setMainTab('pettycash')}>💰 Pengeluaran</button>
      </div>

      {pindah && (
        <PindahMeja
          order={pindah}
          onTutup={() => setPindah(null)}
          onSelesai={(meja) => {
            setPindah(null);
            load();
            alert(`Bill #${pindah.order_no} dipindah ke Meja ${meja.table_number}.`);
          }}
        />
      )}

      <FaceCapture
        open={!!cap}
        title={cap?.title}
        onCapture={onPhotoTaken}
        onCancel={() => setCap(null)}
      />

      {mainTab === 'omzet' && <OmzetTab />}
      {mainTab === 'pettycash' && <PettyCashTab />}
      {mainTab === 'takeorder' && (
        <TakeOrder
          tambahKe={tambahKe}
          onCreated={() => { setTambahKe(null); setMainTab('bill'); load(); }}
          onBatalTambah={() => setTambahKe(null)}
        />
      )}

      {mainTab === 'bill' && (
      <>
      <div className="row" style={{ marginBottom: 14 }}>
        <button className={`btn ${tab === 'active' ? 'btn-brand' : ''}`} onClick={() => setTab('active')}>Aktif</button>
        <button className={`btn ${tab === 'closed' ? 'btn-brand' : ''}`} onClick={() => setTab('closed')}>Selesai</button>
      </div>

      <CariBox
        value={cariBill} onChange={setCariBill}
        placeholder="Cari nota (no. bill, meja, nama, isi pesanan)…"
        hasil={billTersaring.length} total={orders.length}
        style={{ marginBottom: 12 }}
      />

      {loading && <p className="muted">Memuat…</p>}
      {!loading && billTersaring.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>
          {orders.length === 0 ? 'Tidak ada data.' : 'Tidak ada nota yang cocok.'}
        </p></div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
        {billTersaring.map((o) => {
          const paid = o.payment_status === 'paid';
          return (
            <div key={o.id} className="card">
              <div className="between">
                <div>
                  <div className="bold">#{o.order_no} · Meja {o.table_number}</div>
                  <div className="muted small">🕒 {tanggalNota(o.created_at)}</div>
                </div>
                <span className={`badge ${paid ? 'badge-green' : 'badge-amber'}`}>
                  {paid ? 'Lunas' : 'Belum bayar'}
                </span>
              </div>
              <div className="row" style={{ marginTop: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{o.status}</span>
                <span className="badge">{o.payment_method === 'qris' ? 'QRIS' : 'Kasir'}</span>
                {!paid && o.customer_claimed_paid && (
                  <span className="badge badge-amber">🔔 Klaim bayar — cek app bank</span>
                )}
                {!paid && WAJIB_BAYAR_DULU && o.status !== 'cancelled' && !o.kitchen_released && (
                  <span className="badge badge-red">⏸ Dapur menunggu pelunasan</span>
                )}
                {!paid && o.kitchen_released && o.status !== 'cancelled' && (
                  <span className="badge badge-amber">
                    📅 Reservasi ber-DP · sisa {rupiah(Math.max(0, Number(o.total) - Number(o.paid_amount || 0)))}
                  </span>
                )}
                {/* Bill yang tadinya lunas lalu ditambahi pesanan. Tanpa tanda
                    ini kasir menagih ulang dari nol, atau malah tidak menagih
                    selisihnya sama sekali. */}
                {!paid && !o.kitchen_released && Number(o.paid_amount) > 0 && o.status !== 'cancelled' && (
                  <span className="badge badge-amber">
                    💵 Sudah bayar {rupiah(o.paid_amount)} · tagih sisa{' '}
                    {rupiah(Math.max(0, Number(o.total) - Number(o.paid_amount)))}
                  </span>
                )}
                {o.customer_name && <span className="muted small">{o.customer_name}</span>}
              </div>

              <hr className="hr" />
              <div className="col" style={{ gap: 4 }}>
                {(items[o.id] || []).map((it) => (
                  <div key={it.id} className="between small">
                    <span style={it.cancelled_at ? { textDecoration: 'line-through', opacity: 0.55 } : null}>
                      {it.qty}× {it.name}
                      {it.cancelled_at && (
                        <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>
                          batal{it.cancel_reason ? `: ${it.cancel_reason}` : ''}
                        </span>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={it.cancelled_at ? { textDecoration: 'line-through', opacity: 0.55 } : null}>
                        {rupiah(it.price * it.qty)}
                      </span>
                      {tab === 'active' && !it.cancelled_at && o.status !== 'cancelled' && (
                        <button
                          className="btn no-print"
                          style={{ padding: '2px 8px', fontSize: 12 }}
                          disabled={busy === o.id}
                          onClick={() => batalkanItem(o, it)}
                          title="Batalkan item ini saja"
                        >
                          ✖
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <hr className="hr" />
              {Number(o.discount) > 0 && (
                <>
                  <div className="between small">
                    <span className="muted">Subtotal</span><span>{rupiah(o.subtotal)}</span>
                  </div>
                  <div className="between small" style={{ color: '#16794a' }}>
                    <span>Diskon{o.promo_code ? ` (${o.promo_code})` : ''}</span>
                    <span>− {rupiah(o.discount)}</span>
                  </div>
                  <div className="between small">
                    <span className="muted">PB1</span><span>{rupiah(o.tax)}</span>
                  </div>
                </>
              )}
              <div className="between"><span className="bold">Total</span><span className="bold">{rupiah(o.total)}</span></div>

              {/* Kode promo hanya boleh dipasang sebelum lunas — sesudahnya
                  jumlah yang sudah dibayar tidak lagi cocok dengan total. */}
              {tab === 'active' && !paid && o.status !== 'cancelled' && (
                <div className="no-print" style={{ marginTop: 10 }}>
                  {o.promo_code ? (
                    <div className="between">
                      <span className="badge badge-green">🎟 {o.promo_code}</span>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: 13 }}
                        disabled={busy === o.id}
                        onClick={() => lepasPromo(o)}
                      >
                        Lepas kode
                      </button>
                    </div>
                  ) : (
                    <div className="row">
                      <input
                        className="input"
                        placeholder="Kode promo / diskon"
                        value={kodePromo[o.id] || ''}
                        onChange={(e) => setKodePromo((k) => ({ ...k, [o.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') pasangPromo(o); }}
                      />
                      <button
                        className="btn btn-brand"
                        disabled={busy === o.id || !(kodePromo[o.id] || '').trim()}
                        onClick={() => pasangPromo(o)}
                      >
                        Pakai
                      </button>
                    </div>
                  )}
                </div>
              )}

              {o.status === 'cancelled' && (
                <div className="small" style={{ marginTop: 8, color: '#ff8585' }}>
                  ✖ Dibatalkan{o.voided_by ? ` oleh ${o.voided_by}` : ''}
                  {o.void_reason ? ` — "${o.void_reason}"` : ''}
                </div>
              )}

              {tab === 'active' && (
                <div className="col no-print" style={{ marginTop: 12, gap: 8 }}>
                  {/* Tamu paling sering menambah pesanan di tengah makan. Tanpa
                      tombol ini kasir harus pindah tab lalu mencari mejanya
                      lagi dari daftar — dua langkah yang gampang salah meja. */}
                  <button
                    className="btn btn-block"
                    onClick={() => {
                      setTambahKe({
                        id: o.id,
                        paid,
                        table_id: o.table_id,
                        order_no: o.order_no,
                        table_number: o.table_number,
                      });
                      setMainTab('takeorder');
                    }}
                  >
                    ➕ Tambah Pesanan ke Meja Ini
                  </button>
                  {!paid && (
                    <button className="btn btn-green btn-block" disabled={busy === o.id} onClick={() => patch(o.id, { payment_status: 'paid' })}>
                      Tandai Lunas
                    </button>
                  )}
                  <div className="row">
                    <button className="btn btn-block" onClick={() => setPindah(o)}>
                      🔀 Pindah Meja
                    </button>
                  </div>
                  <div className="row">
                    <button className="btn btn-block" disabled={busy === o.id} onClick={() => patch(o.id, { status: 'closed' })}>
                      Tutup Bill
                    </button>
                    <button className="btn btn-block" disabled={busy === o.id} onClick={() => voidBill(o)}>
                      Batalkan
                    </button>
                  </div>
                  <div className="row">
                    <Link href={`/kitchen/print/${o.id}`} target="_blank" className="btn btn-block">🖨️ Struk Dapur</Link>
                    <Link href={`/nota/${o.id}`} target="_blank" className="btn btn-block">🧾 Nota</Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}

/* ---------- Petty Cash (kas kecil) ---------- */
function PettyCashTab() {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'out', amount: '', note: '', created_by: '', category: '' });
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/petty-cash');
    const d = await r.json();
    setBalance(d.balance || 0);
    setTxs(d.transactions || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function pickPhoto(file) {
    if (!file) return;
    try { setPhoto(await compressReceipt(file)); } catch { alert('Gagal memproses foto.'); }
  }

  async function submit() {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { alert('Nominal wajib diisi.'); return; }
    // Foto hanya diwajibkan untuk nominal besar. Memaksa foto untuk uang
    // parkir Rp 2.000 hanya membuat staf malas mencatat sama sekali.
    if (form.type === 'out' && !photo && amount >= 50000) {
      alert('Foto nota wajib untuk pengeluaran Rp 50.000 ke atas.'); return;
    }
    setSaving(true);
    const r = await fetch('/api/petty-cash', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount, photo }),
    });
    if (r.ok) {
      setForm({ type: form.type, amount: '', note: '', created_by: form.created_by, category: form.category });
      setPhoto('');
      setMsg('Tersimpan ✓');
      await load();
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(d.error || 'Gagal menyimpan');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 2500);
  }

  if (loading) return <p className="muted">Memuat…</p>;

  return (
    <div className="col">
      <div className="card" style={{ borderColor: balance < 0 ? 'var(--red)' : 'var(--line)' }}>
        <div className="muted small">Saldo Petty Cash</div>
        <div className="bold" style={{ fontSize: 26 }}>{rupiah(balance)}</div>
      </div>

      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Catat Transaksi</div>
        <div className="row">
          <label className={`btn ${form.type === 'in' ? 'btn-brand' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="pc-type" style={{ display: 'none' }} checked={form.type === 'in'} onChange={() => setForm({ ...form, type: 'in' })} />
            ➕ Isi Ulang
          </label>
          <label className={`btn ${form.type === 'out' ? 'btn-brand' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="pc-type" style={{ display: 'none' }} checked={form.type === 'out'} onChange={() => setForm({ ...form, type: 'out' })} />
            ➖ Pengeluaran
          </label>
        </div>
        <input className="input" style={{ marginTop: 8 }} type="number" placeholder="Nominal (Rp)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        {form.type === 'out' && (
          <>
            <div className="muted small" style={{ marginTop: 10 }}>Jenis pengeluaran</div>
            <div className="opt-row" style={{ marginTop: 4 }}>
              {['Listrik', 'Gas', 'Air', 'Parkir', 'Bensin', 'Belanja dapur', 'Kebersihan', 'Lainnya'].map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip ${form.category === k ? 'chip-on' : ''}`}
                  onClick={() => setForm({ ...form, category: form.category === k ? '' : k })}
                >
                  {k}
                </button>
              ))}
            </div>
          </>
        )}
        <input className="input" style={{ marginTop: 8 }} placeholder="Catatan (mis. beli es batu)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <input className="input" style={{ marginTop: 8 }} placeholder="Nama petugas" value={form.created_by} onChange={(e) => setForm({ ...form, created_by: e.target.value })} />

        {form.type === 'out' && (
          <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
            <label className="btn" style={{ cursor: 'pointer' }}>
              📷 Foto Nota {Number(form.amount) >= 50000 ? '(wajib)' : '(opsional)'}
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="nota" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
            )}
          </div>
        )}

        <button className="btn btn-brand btn-block" style={{ marginTop: 10 }} disabled={saving} onClick={submit}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
        {msg && <p className="small" style={{ marginTop: 8 }}>{msg}</p>}
      </div>

      <div className="col">
        <div className="h2">Riwayat</div>
        {txs.map((t) => (
          <div key={t.id} className="card">
            <div className="between">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {t.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photo} alt="nota" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                )}
                <div>
                  <div className="bold">{t.note || (t.type === 'in' ? 'Isi ulang' : 'Pengeluaran')}</div>
                  <div className="muted small">{t.created_by || '—'} · {jamWIB(t.created_at)}</div>
                </div>
              </div>
              <span className="bold" style={{ color: t.type === 'in' ? '#5ee996' : '#ff8585' }}>
                {t.type === 'in' ? '+' : '−'}{rupiah(t.amount)}
              </span>
            </div>
          </div>
        ))}
        {txs.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada transaksi.</p></div>}
      </div>
    </div>
  );
}

export default function CashierGated() {
  return (
    <PinGate scope="kasir" title="Masuk Kasir">
      <CashierPage />
    </PinGate>
  );
}
