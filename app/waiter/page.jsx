'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import PinGate from '../components/PinGate';
import TablesTab from '../admin/TablesTab';
import AvailabilityTab from './AvailabilityTab';
import { stockLimitByMenu, attachStockLimit } from '../../lib/stockLimit';

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

function jamWIB(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function WaiterPage() {
  const [tab, setTab] = useState('calls');
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [calls, setCalls] = useState([]);
  const [origin, setOrigin] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef(null);
  const seenCallIds = useRef(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const load = useCallback(async () => {
    const [t, m] = await Promise.all([
      supabase.from('tables').select('*').order('table_number'),
      // Hanya ambil kolom yang aman ditampilkan waiter (TIDAK ada cost/HPP di sini)
      supabase
        .from('menu_items')
        .select('id, name, price, available, daily_qty, category_id')
        .order('sort_order'),
    ]);
    setTables(t.data || []);

    // Sisa porsi dari stok bahan. recipe_items -> inventory_items(stock_qty)
    // saja: tidak ada harga/HPP bahan yang ikut terbawa ke layar waiter.
    const menu = m.data || [];
    let byMenu = {};
    if (menu.length) {
      const { data: recipeRows } = await supabase
        .from('recipe_items')
        .select('menu_item_id, qty, inventory_items(stock_qty)')
        .in('menu_item_id', menu.map((i) => i.id));
      byMenu = stockLimitByMenu(recipeRows);
    }
    setItems(attachStockLimit(menu, byMenu));
  }, []);
  useEffect(() => { load(); }, [load]);

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

  // Alert suara saat ada panggilan baru (pola sama dengan Kitchen Display).
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
      speak(`Meja ${newOnes[0].table_number} memanggil waiter`);
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

  async function handled(call) {
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
          <h1 className="title">🧑‍🍳 Waiter</h1>
          <p className="muted small">Kelola meja/QR &amp; tandai menu habis. Harga &amp; resep dikelola Admin.</p>
        </div>
        <div className="row">
          <button className={`btn ${soundOn ? 'btn-green' : 'btn-brand'}`} onClick={enableSound}>
            {soundOn ? '🔊 Suara Aktif' : '🔔 Aktifkan Suara'}
          </button>
          <Link href="/" className="btn">← Beranda</Link>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <button className={`btn ${tab === 'calls' ? 'btn-brand' : ''}`} onClick={() => setTab('calls')}>
          🔔 Panggilan {calls.length > 0 ? `(${calls.length})` : ''}
        </button>
        <button className={`btn ${tab === 'tables' ? 'btn-brand' : ''}`} onClick={() => setTab('tables')}>Meja &amp; QR</button>
        <button className={`btn ${tab === 'avail' ? 'btn-brand' : ''}`} onClick={() => setTab('avail')}>Ketersediaan Menu</button>
      </div>

      {tab === 'calls' && (
        <div className="col">
          {calls.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>Tidak ada panggilan.</p></div>}
          {calls.map((c) => (
            <div key={c.id} className="card" style={{ borderColor: 'var(--red)' }}>
              <div className="between">
                <div>
                  <span className="bold">Meja {c.table_number}</span>
                  {c.reason && <span className="muted small"> · {c.reason}</span>}
                </div>
                <span className="badge">{jamWIB(c.created_at)}</span>
              </div>
              <button className="btn btn-green btn-block" style={{ marginTop: 10 }} onClick={() => handled(c)}>✅ Sudah ditangani</button>
            </div>
          ))}
        </div>
      )}
      {tab === 'tables' && <TablesTab tables={tables} origin={origin} reload={load} />}
      {tab === 'avail' && <AvailabilityTab items={items} reload={load} />}
    </div>
  );
}

export default function WaiterGated() {
  return (
    <PinGate scope="waiter" title="Masuk Waiter">
      <WaiterPage />
    </PinGate>
  );
}
