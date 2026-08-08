'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import PinGate from '../components/PinGate';
import { variantLabels } from '../../lib/variants';
import { STATIONS, STATION_GORENG } from '../../lib/stations';

// Bunyi "ding-dong" pendek pakai Web Audio API (tanpa file audio eksternal).
function beep(ctx) {
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
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

// Format durasi berjalan jadi "Xm Ys" (atau "Hj Xm" kalau lewat 1 jam).
function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m ${s}s`;
}
// <10 menit: aman · 10-20 menit: waspada · >20 menit: lambat
function elapsedBadgeClass(ms) {
  const min = ms / 60000;
  if (min >= 20) return 'badge-red';
  if (min >= 10) return 'badge-amber';
  return 'badge-blue';
}

function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [pendingPrints, setPendingPrints] = useState({}); // order_id -> print_job
  const [stationFilter, setStationFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [completing, setCompleting] = useState('');
  const audioCtxRef = useRef(null);
  const seenOrderIds = useRef(null); // null = belum pernah load (jangan alert saat pertama buka)

  // Timer berjalan tiap detik supaya durasi order kelihatan hidup, terpisah
  // dari polling data (5 detik) supaya tetap smooth di antara refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function enableSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
      beep(audioCtxRef.current);
      speak('Sound enabled');
      setSoundOn(true);
    } catch {}
  }

  const load = useCallback(async () => {
    const { data: ords } = await supabase
      .from('orders')
      .select('id, order_no, table_number, status, payment_method, payment_status, created_at, note')
      .in('status', ['open', 'preparing', 'served'])
      .order('created_at', { ascending: true });

    const ids = (ords || []).map((o) => o.id);
    let items = [];
    let jobs = [];
    if (ids.length) {
      const r1 = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids)
        .is('cancelled_at', null)
        .neq('kitchen_status', 'served');
      items = r1.data || [];
      const r2 = await supabase
        .from('print_jobs')
        .select('*')
        .in('order_id', ids)
        .eq('status', 'pending');
      jobs = r2.data || [];
    }

    const itemsByOrder = {};
    for (const it of items) (itemsByOrder[it.order_id] ||= []).push(it);

    setOrders(
      (ords || [])
        .map((o) => ({ ...o, items: itemsByOrder[o.id] || [] }))
        .filter((o) => o.items.length)
    );
    setPendingPrints(Object.fromEntries(jobs.map((j) => [j.order_id, j])));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Deteksi order baru & bunyikan alert suara ("New order coming!").
  // Saat pertama kali halaman dibuka, order yang sudah ada TIDAK di-alert
  // (supaya tidak berbunyi beruntun untuk pesanan lama).
  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id));
    if (seenOrderIds.current === null) {
      seenOrderIds.current = currentIds;
      return;
    }
    const newOnes = orders.filter((o) => !seenOrderIds.current.has(o.id));
    seenOrderIds.current = currentIds;
    if (!newOnes.length) return;

    // Kalau tablet ini di-filter ke 1 station tertentu, hanya alert kalau
    // order barunya memang ada item untuk station itu.
    const relevant = stationFilter === 'all'
      ? newOnes
      : newOnes.filter((o) => o.items.some((i) => i.station_id === stationFilter));
    if (!relevant.length) return;

    if (soundOn && audioCtxRef.current) {
      beep(audioCtxRef.current);
      speak(relevant.length > 1 ? 'New orders coming!' : 'New order coming!');
    }
  }, [orders, soundOn, stationFilter]);

  async function setItemStatus(itemId, status) {
    await fetch(`/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kitchen_status: status }),
    });
    load();
  }

  // Selesai digoreng -> baris pesanan pindah sendiri ke station Bakaran.
  async function selesaiGoreng(itemId) {
    await fetch(`/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advance_stage: true }),
    });
    load();
  }

  // Tandai seluruh order selesai sekaligus + catat durasi (masuk -> selesai)
  // ke log kinerja dapur untuk penilaian nanti.
  async function completeOrder(orderId) {
    setCompleting(orderId);
    await fetch(`/api/orders/${orderId}/kitchen-complete`, { method: 'POST' });
    await load();
    setCompleting('');
  }

  const visibleOrders = useMemo(() => {
    if (stationFilter === 'all') return orders;
    return orders
      .map((o) => ({ ...o, items: o.items.filter((i) => i.station_id === stationFilter) }))
      .filter((o) => o.items.length);
  }, [orders, stationFilter]);

  return (
    <div className="container">
      <div className="between" style={{ padding: '16px 0' }}>
        <div>
          <h1 className="title">🍳 Kitchen Display</h1>
          <p className="muted small">Auto-refresh tiap 5 detik · 1 printer untuk 3 station</p>
        </div>
        <div className="row no-print">
          <button className={`btn ${soundOn ? 'btn-green' : 'btn-brand'}`} onClick={enableSound}>
            {soundOn ? '🔊 Suara Aktif' : '🔔 Aktifkan Suara'}
          </button>
          <Link href="/" className="btn">← Beranda</Link>
        </div>
      </div>

      <div className="row no-print" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          className={`btn ${stationFilter === 'all' ? 'btn-brand' : ''}`}
          onClick={() => setStationFilter('all')}
        >
          Semua
        </button>
        {STATIONS.map((s) => (
          <button
            key={s.id}
            className={`btn ${stationFilter === s.id ? 'btn-brand' : ''}`}
            onClick={() => setStationFilter(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Memuat…</p>}
      {!loading && visibleOrders.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada pesanan aktif.</p></div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
        {visibleOrders.map((o) => {
          const byStation = STATIONS.map((s) => ({
            ...s,
            items: o.items.filter((i) => i.station_id === s.id),
          })).filter((s) => s.items.length);
          const otherItems = o.items.filter(
            (i) => !STATIONS.some((s) => s.id === i.station_id)
          );

          const elapsedMs = now - new Date(o.created_at).getTime();
          return (
            <div key={o.id} className="card">
              <div className="between">
                <div>
                  <span className="bold">#{o.order_no}</span> · Meja {o.table_number}
                </div>
                <span className={`badge ${elapsedBadgeClass(elapsedMs)}`}>⏱ {formatElapsed(elapsedMs)}</span>
              </div>
              <div className="row" style={{ marginTop: 6 }}>
                <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`}>
                  {o.payment_status === 'paid' ? 'Lunas' : o.payment_method === 'qris' ? 'Nunggu QRIS' : 'Bayar kasir'}
                </span>
                {pendingPrints[o.id] && <span className="badge badge-red">Belum dicetak</span>}
              </div>
              {o.note && <p className="muted small" style={{ marginTop: 6 }}>Catatan: {o.note}</p>}

              <hr className="hr" />

              {byStation.map((s) => (
                <div key={s.id} className={`card ${s.cls}`} style={{ marginBottom: 8, padding: 10 }}>
                  <div className="bold small" style={{ marginBottom: 6 }}>{s.name}</div>
                  {s.items.map((it) => (
                    <div key={it.id} className="between" style={{ marginBottom: 6 }}>
                      <div>
                        <span className="bold">{it.qty}×</span> {it.name}
                        {variantLabels(it).map((lab) => (
                          <span key={lab} className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10 }}>
                            {lab.toUpperCase()}
                          </span>
                        ))}
                        {it.note && <div className="muted small">“{it.note}”</div>}
                        <div>
                          <span className={`badge ${it.kitchen_status === 'ready' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: 10 }}>
                            {it.kitchen_status}
                          </span>
                          {it.stage === 'bakar' && (
                            <span className="badge badge-amber" style={{ fontSize: 10, marginLeft: 4 }}>
                              sudah digoreng
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col no-print" style={{ gap: 4 }}>
                        {/* Di station Goreng, tombolnya bukan "Ready" tapi
                            "Selesai Goreng" — itemnya belum jadi, baru
                            pindah ke tahap bakaran. */}
                        {s.id === STATION_GORENG && it.stage === 'goreng' ? (
                          <button
                            className="btn btn-brand"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => selesaiGoreng(it.id)}
                          >
                            🍳 Selesai Goreng →
                          </button>
                        ) : it.kitchen_status !== 'ready' ? (
                          <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setItemStatus(it.id, 'ready')}>Ready</button>
                        ) : (
                          <button className="btn btn-green" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setItemStatus(it.id, 'served')}>Served</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {otherItems.length > 0 && (
                <div className="card" style={{ marginBottom: 8, padding: 10 }}>
                  <div className="bold small" style={{ marginBottom: 6 }}>Tanpa station</div>
                  {otherItems.map((it) => (
                    <div key={it.id} className="between">
                      <span><span className="bold">{it.qty}×</span> {it.name}</span>
                      <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setItemStatus(it.id, 'served')}>Served</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="row no-print" style={{ marginTop: 8 }}>
                <Link
                  href={`/kitchen/print/${o.id}`}
                  target="_blank"
                  className="btn btn-brand btn-block"
                >
                  🖨️ Cetak Dapur (3 station)
                </Link>
                <button
                  className="btn btn-green btn-block"
                  disabled={completing === o.id}
                  onClick={() => completeOrder(o.id)}
                >
                  {completing === o.id ? 'Menyimpan…' : '✅ Pesanan Selesai'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function KitchenGated() {
  return (
    <PinGate scope="dapur" title="Masuk Dapur">
      <KitchenPage />
    </PinGate>
  );
}
