'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import PinGate from '../components/PinGate';
import TablesTab from '../admin/TablesTab';
import AvailabilityTab from './AvailabilityTab';

function WaiterPage() {
  const [tab, setTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [origin, setOrigin] = useState('');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const load = useCallback(async () => {
    const [t, m] = await Promise.all([
      supabase.from('tables').select('*').order('table_number'),
      // Hanya ambil kolom yang aman ditampilkan waiter (TIDAK ada cost/HPP di sini)
      supabase.from('menu_items').select('id, name, price, available').order('sort_order'),
    ]);
    setTables(t.data || []);
    setItems(m.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="container">
      <div className="between" style={{ padding: '16px 0' }}>
        <div>
          <h1 className="title">🧑‍🍳 Waiter</h1>
          <p className="muted small">Kelola meja/QR &amp; tandai menu habis. Harga &amp; resep dikelola Admin.</p>
        </div>
        <Link href="/" className="btn">← Beranda</Link>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className={`btn ${tab === 'tables' ? 'btn-brand' : ''}`} onClick={() => setTab('tables')}>Meja &amp; QR</button>
        <button className={`btn ${tab === 'avail' ? 'btn-brand' : ''}`} onClick={() => setTab('avail')}>Ketersediaan Menu</button>
      </div>

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
