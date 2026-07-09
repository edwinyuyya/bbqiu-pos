'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Notif menu yang habis/kosong hari ini, muncul saat pertama buka apps.
export default function SoldOutBanner() {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('soldout_seen') === '1') return;
    supabase
      .from('menu_items')
      .select('name')
      .eq('available', false)
      .order('name')
      .then(({ data }) => {
        if (data && data.length) { setItems(data); setShow(true); }
      });
  }, []);

  function dismiss() {
    sessionStorage.setItem('soldout_seen', '1');
    setShow(false);
  }

  if (!show || !items.length) return null;

  return (
    <div className="card" style={{ borderColor: 'var(--red)', marginBottom: 12 }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <div className="h2" style={{ color: '#ff8585' }}>⚠️ Menu Kosong Hari Ini ({items.length})</div>
        <button className="btn" style={{ padding: '4px 10px', fontSize: 13 }} onClick={dismiss}>Tutup</button>
      </div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        {items.map((m, i) => (
          <span key={i} className="badge badge-red">{m.name}</span>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
        Aktifkan lagi lewat <b>Admin → Menu → Set tersedia</b> bila sudah ada stok.
      </p>
    </div>
  );
}
