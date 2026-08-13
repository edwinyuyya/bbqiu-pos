'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import PinGate from '../components/PinGate';
import AlertsPanel from '../components/AlertsPanel';
import CariBox from '../components/CariBox';
import PilihCari from '../components/PilihCari';
import TablesTab from './TablesTab';
import PromoTab from './PromoTab';
import { cocok } from '../../lib/cari';

function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}
// Kompres gambar (dari file) jadi data URL kecil (lebar maks 640px, JPEG) untuk foto menu.
function compressImage(file, maxW = 640) {
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

function AdminPage() {
  const [tab, setTab] = useState('tables');
  const [stations, setStations] = useState([]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [promos, setPromos] = useState([]);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    const [s, t, c, m, invRes, pr] = await Promise.all([
      supabase.from('stations').select('*').order('sort_order'),
      supabase.from('tables').select('*').order('table_number'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order'),
      fetch('/api/inventory').then((r) => r.json()).catch(() => ({ items: [] })),
      supabase.from('promos').select('*').order('created_at', { ascending: false }),
    ]);
    setStations(s.data || []);
    setTables(t.data || []);
    setCategories(c.data || []);
    setItems(m.data || []);
    setInventory(invRes.items || []);
    setPromos(pr.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="container">
      <div className="between" style={{ padding: '16px 0' }}>
        <div>
          <h1 className="title">⚙️ Admin</h1>
          <p className="muted small">Kelola meja, QR, menu, dan promo</p>
        </div>
        <Link href="/" className="btn">← Beranda</Link>
      </div>

      <AlertsPanel />

      <div className="row" style={{ marginBottom: 14 }}>
        <button className={`btn ${tab === 'tables' ? 'btn-brand' : ''}`} onClick={() => setTab('tables')}>Meja &amp; QR</button>
        <button className={`btn ${tab === 'menu' ? 'btn-brand' : ''}`} onClick={() => setTab('menu')}>Menu</button>
        <button className={`btn ${tab === 'promo' ? 'btn-brand' : ''}`} onClick={() => setTab('promo')}>🎟 Promo</button>
        <Link href="/admin/label-harga" className="btn">🏷️ Label Harga</Link>
      </div>

      {tab === 'tables' && (
        <TablesTab tables={tables} origin={origin} reload={load} />
      )}
      {tab === 'menu' && (
        <MenuTab items={items} categories={categories} stations={stations} inventory={inventory} reload={load} />
      )}
      {tab === 'promo' && (
        <PromoTab promos={promos} categories={categories} items={items} reload={load} />
      )}
    </div>
  );
}

function MenuTab({ items, categories, stations, inventory, reload }) {
  const EMPTY = { name: '', price: '', category_id: '', station_id: '', description: '', image_url: '', daily_qty: '', discount_percent: '' };
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [recipeFor, setRecipeFor] = useState(null); // menu item yang sedang dibuka resepnya
  const [q, setQ] = useState('');

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  // Daftar menu sudah 90-an baris; tanpa pencarian, mengubah harga satu menu
  // berarti menggulir sampai ketemu.
  const tersaring = useMemo(
    () => items.filter((it) => cocok([it.name, it.description, catById[it.category_id]?.name], q)),
    [items, q, catById],
  );

  async function pickImage(file, setState) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert('Foto terlalu besar (maks 8MB).'); return; }
    try {
      const dataUrl = await compressImage(file);
      setState((f) => ({ ...f, image_url: dataUrl }));
    } catch { alert('Gagal memproses foto.'); }
  }

  function startEdit(it) {
    setEditId(it.id);
    setEditForm({
      name: it.name || '',
      price: it.price ?? '',
      category_id: it.category_id || '',
      station_id: it.station_id || '',
      description: it.description || '',
      image_url: it.image_url || '',
      daily_qty: it.daily_qty ?? '',
      discount_percent: it.discount_percent ?? '',
    });
  }
  async function saveEdit(it) {
    if (!editForm.name.trim() || editForm.price === '') return;
    setBusy(true);
    const station = editForm.station_id || (editForm.category_id ? catById[editForm.category_id]?.station_id : null) || null;
    await supabase.from('menu_items').update({
      name: editForm.name.trim(),
      price: Number(editForm.price),
      description: editForm.description.trim() || null,
      category_id: editForm.category_id || null,
      station_id: station,
      image_url: editForm.image_url || null,
      daily_qty: editForm.daily_qty === '' ? null : Number(editForm.daily_qty),
      discount_percent: editForm.discount_percent === '' ? null : Number(editForm.discount_percent),
    }).eq('id', it.id);
    setEditId(null);
    await reload();
    setBusy(false);
  }

  async function addItem() {
    if (!form.name.trim() || !form.price) return;
    setBusy(true);
    const station = form.station_id || (form.category_id ? catById[form.category_id]?.station_id : null) || null;
    await supabase.from('menu_items').insert({
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      station_id: station,
      image_url: form.image_url || null,
      daily_qty: form.daily_qty === '' ? null : Number(form.daily_qty),
      discount_percent: form.discount_percent === '' ? null : Number(form.discount_percent),
      available: true,
    });
    setForm(EMPTY);
    await reload();
    setBusy(false);
  }
  // Mengunci satu menu dari SEMUA kode promo. Dipakai untuk paket dan menu
  // harga khusus: harganya sudah dipotong di muka, jadi kena promo lagi
  // berarti dijual di bawah modal.
  async function togglePromo(it) {
    await supabase.from('menu_items')
      .update({ promo_eligible: it.promo_eligible === false })
      .eq('id', it.id);
    reload();
  }
  async function toggle(it) {
    await supabase.from('menu_items').update({ available: !it.available }).eq('id', it.id);
    reload();
  }
  async function del(it) {
    if (!confirm(`Hapus ${it.name}?`)) return;
    await supabase.from('menu_items').delete().eq('id', it.id);
    reload();
  }
  // Diskon menu bisa diubah langsung dari daftar — admin sering hanya perlu
  // menyalakan promo satu item untuk besok, tanpa mengedit seluruh menunya.
  async function setDiskon(it, nilai) {
    const n = nilai === '' ? null : Math.min(100, Math.max(0, Number(nilai) || 0));
    if ((n ?? null) === (it.discount_percent ?? null)) return;
    await supabase.from('menu_items').update({ discount_percent: n || null }).eq('id', it.id);
    reload();
  }

  // Sebagian menu shao kao digoreng dulu sebelum dibakar, sebagian langsung
  // dibakar (sayur & jamur). Bisa diubah sendiri karena penggolongannya
  // urusan dapur, bukan urusan kode.
  async function toggleGoreng(it) {
    await supabase.from('menu_items')
      .update({ needs_fry_first: !it.needs_fry_first }).eq('id', it.id);
    reload();
  }

  async function setStation(it, station_id) {
    await supabase.from('menu_items').update({ station_id: station_id || null }).eq('id', it.id);
    reload();
  }

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Tambah Menu</div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <input className="input" placeholder="Nama menu" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="number" placeholder="Harga" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <select className="select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">— Kategori —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select" value={form.station_id} onChange={(e) => setForm({ ...form, station_id: e.target.value })}>
            <option value="">Station: ikut kategori</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <input className="input" style={{ marginTop: 10 }} placeholder="Deskripsi (opsional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="row" style={{ marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="input" type="number" style={{ width: 200 }} placeholder="Sisa porsi hari ini (opsional)" value={form.daily_qty} onChange={(e) => setForm({ ...form, daily_qty: e.target.value })} />
          <input className="input" type="number" style={{ width: 150 }} placeholder="Diskon % (opsional)" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
          <label className="btn" style={{ cursor: 'pointer' }}>
            📷 Foto
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickImage(e.target.files?.[0], setForm)} />
          </label>
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
          )}
          {form.image_url && <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setForm({ ...form, image_url: '' })}>Hapus foto</button>}
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>Sisa porsi kosong = tak terbatas. Kalau diisi, menu auto-tutup saat habis.</p>
        <button className="btn btn-brand" style={{ marginTop: 10 }} disabled={busy} onClick={addItem}>Tambah Menu</button>
      </div>

      <CariBox
        value={q} onChange={setQ}
        placeholder="Cari menu (nama, kategori, deskripsi)…"
        hasil={tersaring.length} total={items.length}
      />

      <div className="col">
        {tersaring.length === 0 && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              {items.length === 0 ? 'Belum ada menu.' : 'Tidak ada menu yang cocok.'}
            </p>
          </div>
        )}
        {tersaring.map((it) => (
          <div key={it.id} className="card">
            {editId === it.id ? (
              <div className="col">
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <input className="input" placeholder="Nama menu" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="input" type="number" placeholder="Harga" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                  <select className="select" value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}>
                    <option value="">— Kategori —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className="select" value={editForm.station_id} onChange={(e) => setEditForm({ ...editForm, station_id: e.target.value })}>
                    <option value="">Station: ikut kategori</option>
                    {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <input className="input" placeholder="Deskripsi (opsional)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <input className="input" type="number" style={{ width: 200 }} placeholder="Sisa porsi hari ini (opsional)" value={editForm.daily_qty} onChange={(e) => setEditForm({ ...editForm, daily_qty: e.target.value })} />
                  <input className="input" type="number" style={{ width: 150 }} placeholder="Diskon % (opsional)" value={editForm.discount_percent} onChange={(e) => setEditForm({ ...editForm, discount_percent: e.target.value })} />
                  <label className="btn" style={{ cursor: 'pointer' }}>
                    📷 Foto
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickImage(e.target.files?.[0], setEditForm)} />
                  </label>
                  {editForm.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editForm.image_url} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  {editForm.image_url && <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setEditForm({ ...editForm, image_url: '' })}>Hapus foto</button>}
                </div>
                <div className="row">
                  <button className="btn btn-brand" disabled={busy} onClick={() => saveEdit(it)}>Simpan</button>
                  <button className="btn" onClick={() => setEditId(null)}>Batal</button>
                </div>
              </div>
            ) : (
              <>
                <div className="between">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {it.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={it.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                    )}
                    <div>
                      <span className="bold">{it.name}</span> · {rupiah(it.price)}
                      {it.daily_qty != null && <span className="badge badge-amber" style={{ marginLeft: 6 }}>sisa {it.daily_qty}</span>}
                      {Number(it.discount_percent) > 0 && (
                        <span className="badge badge-green" style={{ marginLeft: 6 }}>
                          diskon {Number(it.discount_percent)}%
                        </span>
                      )}
                      {it.promo_eligible === false && (
                        <span className="badge badge-red" style={{ marginLeft: 6 }}>
                          🔒 bebas promo
                        </span>
                      )}
                      {it.needs_fry_first && (
                        <span className="badge badge-amber" style={{ marginLeft: 6 }}>
                          🍳 goreng dulu
                        </span>
                      )}
                      {it.description && <div className="muted small">{it.description}</div>}
                    </div>
                  </div>
                  <span className={`badge ${it.available ? 'badge-green' : 'badge-red'}`}>{it.available ? 'Tersedia' : 'Habis'}</span>
                </div>
                <div className="row no-print" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                  <select className="select" style={{ width: 'auto' }} value={it.station_id || ''} onChange={(e) => setStation(it, e.target.value)}>
                    <option value="">Tanpa station</option>
                    {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <span className="row" style={{ alignItems: 'center', gap: 4 }}>
                    <span className="muted small">Diskon</span>
                    <input
                      className="input"
                      style={{ width: 70, textAlign: 'center', padding: '6px 8px' }}
                      inputMode="numeric"
                      placeholder="—"
                      defaultValue={it.discount_percent ?? ''}
                      onBlur={(e) => setDiskon(it, e.target.value)}
                      title="Diskon khusus menu ini, dalam persen"
                    />
                    <span className="muted small">%</span>
                  </span>
                  <button className="btn btn-brand" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => startEdit(it)}>✏️ Edit</button>
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => setRecipeFor(recipeFor === it.id ? null : it.id)}>🧪 Resep</button>
                  {(it.station_id === 'shaokao' || catById[it.category_id]?.station_id === 'shaokao') && (
                    <button
                      className="btn"
                      style={{ padding: '6px 10px', fontSize: 13 }}
                      onClick={() => toggleGoreng(it)}
                      title="Apakah menu ini digoreng dulu sebelum dibakar?"
                    >
                      {it.needs_fry_first ? '🍳 Goreng dulu: YA' : '🍳 Goreng dulu: TIDAK'}
                    </button>
                  )}
                  <button
                    className="btn" style={{ padding: '6px 10px', fontSize: 13 }}
                    onClick={() => togglePromo(it)}
                    title="Kalau dikunci, menu ini tidak pernah kena kode promo apa pun — sekarang maupun promo yang dibuat nanti"
                  >
                    {it.promo_eligible === false ? '🔒 Bebas promo: YA' : '🔒 Bebas promo: TIDAK'}
                  </button>
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => toggle(it)}>{it.available ? 'Set habis' : 'Set tersedia'}</button>
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => del(it)}>Hapus</button>
                </div>
                {recipeFor === it.id && <RecipeEditor menuItem={it} inventory={inventory} />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Editor Resep/BOM per menu ---------- */
function RecipeEditor({ menuItem, inventory }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invId, setInvId] = useState('');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);

  const invById = useMemo(() => Object.fromEntries(inventory.map((i) => [i.id, i])), [inventory]);

  const load = useCallback(async () => {
    const r = await fetch(`/api/recipes?menu_item_id=${menuItem.id}`);
    const d = await r.json();
    setRows(d.recipe || []);
    setLoading(false);
  }, [menuItem.id]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!invId || !qty || Number(qty) <= 0) return;
    setBusy(true);
    await fetch('/api/recipes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu_item_id: menuItem.id, inventory_item_id: invId, qty: Number(qty) }),
    });
    setInvId(''); setQty('');
    await load();
    setBusy(false);
  }
  async function del(id) {
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    load();
  }

  const hpp = rows.reduce((s, r) => s + Number(r.qty) * Number(r.inventory_items?.cost_price || 0), 0);
  const price = Number(menuItem.price) || 0;
  const margin = price - hpp;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : null;

  return (
    <div className="card" style={{ marginTop: 10, background: 'rgba(255,255,255,.03)' }}>
      <div className="h2" style={{ marginBottom: 8, fontSize: 15 }}>🧪 Resep: {menuItem.name} <span className="muted small">(per 1 porsi)</span></div>
      {loading ? <p className="muted small">Memuat…</p> : (
        <>
          <div className="col" style={{ gap: 6 }}>
            {rows.map((r) => (
              <div key={r.id} className="between small">
                <span>
                  {r.inventory_items?.name || '(bahan dihapus)'} — {r.qty} {r.inventory_items?.unit}
                  {r.inventory_items?.cost_price != null && (
                    <span className="muted"> · {rupiah(Number(r.qty) * Number(r.inventory_items.cost_price))}</span>
                  )}
                </span>
                <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => del(r.id)}>Hapus</button>
              </div>
            ))}
            {rows.length === 0 && <p className="muted small" style={{ margin: 0 }}>Belum ada bahan. Menu ini tidak akan memotong stok apapun.</p>}
          </div>
          {rows.length > 0 && (
            <div className="card" style={{ marginTop: 10, padding: '8px 12px' }}>
              <div className="between small"><span className="muted">HPP (estimasi, harga beli terakhir)</span><span className="bold">{rupiah(hpp)}</span></div>
              <div className="between small" style={{ marginTop: 4 }}><span className="muted">Harga jual</span><span>{rupiah(price)}</span></div>
              <div className="between small" style={{ marginTop: 4 }}>
                <span className="muted">Margin</span>
                <span className="bold" style={{ color: margin >= 0 ? '#5ee996' : '#ff8585' }}>
                  {rupiah(margin)}{marginPct != null ? ` (${marginPct}%)` : ''}
                </span>
              </div>
            </div>
          )}
          <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <PilihCari
              style={{ flex: 1, minWidth: 180 }}
              options={inventory.map((i) => ({ id: i.id, label: i.name, sub: i.unit }))}
              value={invId} onChange={setInvId}
              placeholder="Cari bahan…"
              kosong="Bahan tidak ada. Tambahkan dulu di Stok → + Barang."
            />
            <input className="input" type="number" style={{ width: 90 }} placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
            <span className="muted small" style={{ alignSelf: 'center' }}>{invId ? invById[invId]?.unit : ''}</span>
            <button className="btn btn-brand" disabled={busy} onClick={add}>Tambah</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminGated() {
  return (
    <PinGate scope="admin" title="Masuk Admin">
      <AdminPage />
    </PinGate>
  );
}
