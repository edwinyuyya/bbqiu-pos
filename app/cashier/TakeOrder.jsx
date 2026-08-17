'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { taxPercent } from '../../lib/tax';
import { cocok } from '../../lib/cari';
import { urutkanMeja } from '../../lib/urutMeja';
import { bacaJson } from '../../lib/bacaJson';
import PilihPelanggan from './PilihPelanggan';
import { MENU_HADIAH, KUNJUNGAN_HADIAH } from '../../lib/pelanggan';
import {
  COOK_METHODS,
  DRINK_TEMPS,
  SWEETNESS,
  cartKey,
  parseCartKey,
  variantLabels,
} from '../../lib/variants';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

// Menu tanpa foto tetap harus bisa dibedakan sekilas. Inisial di atas warna
// yang tetap sama untuk nama yang sama membuat kasir hafal posisinya karena
// bentuk dan warnanya, bukan karena membaca tiap kali.
const WARNA = ['#c2410c', '#b45309', '#15803d', '#1d4ed8', '#7c2d12',
  '#0f766e', '#9f1239', '#4d7c0f', '#6d28d9', '#a16207'];

function inisial(nama) {
  const kata = String(nama || '?').trim().split(/\s+/).filter(Boolean);
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  return (kata[0][0] + kata[1][0]).toUpperCase();
}
function warnaDari(nama) {
  let h = 0;
  for (const c of String(nama || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return WARNA[h % WARNA.length];
}

function Ubin({ item, jumlah, tanda, onKlik }) {
  return (
    <button className={`ubin ${jumlah > 0 ? 'dipilih' : ''}`} onClick={onKlik} title={item.name}>
      <div className="ubin-gambar" style={{ background: warnaDari(item.name) }}>
        {item.image_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image_url} alt={item.name} />
          : inisial(item.name)}
      </div>
      <div className="ubin-teks">
        <div className="ubin-nama">{item.name}</div>
        <div className="ubin-harga">{rupiah(item.price)}</div>
      </div>
      {tanda && <span className="ubin-tanda">{tanda}</span>}
      {jumlah > 0 && <span className="ubin-jumlah">{jumlah}</span>}
    </button>
  );
}

// Menu yang wajib pilih varian tidak bisa ditambahkan dengan satu ketukan —
// pilihannya ditanyakan dulu di jendela ini, lalu langsung masuk keranjang.
function PilihVarian({ item, onTambah, onTutup }) {
  const [method, setMethod] = useState(COOK_METHODS[0]?.id || '');
  const [temp, setTemp] = useState(DRINK_TEMPS[0]?.id || '');
  const [sweet, setSweet] = useState(SWEETNESS[1]?.id || SWEETNESS[0]?.id || '');
  const [qty, setQty] = useState(1);

  function tambah() {
    onTambah(
      item.needs_cook_method ? { method } : { temp, sweet },
      qty,
    );
  }

  return (
    <div className="tirai" onClick={onTutup}>
      <div className="card kotak" onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <div>
            <div className="h2">{item.name}</div>
            <div className="muted small">{rupiah(item.price)}</div>
          </div>
          <button className="btn" onClick={onTutup}>✕</button>
        </div>

        <hr className="hr" />

        {item.needs_cook_method && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Cara masak</div>
            <div className="opt-row">
              {COOK_METHODS.map((m) => (
                <button key={m.id} className={`chip ${method === m.id ? 'chip-on' : ''}`}
                  onClick={() => setMethod(m.id)}>{m.emoji} {m.label}</button>
              ))}
            </div>
          </>
        )}

        {item.needs_drink_option && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Suhu</div>
            <div className="opt-row">
              {DRINK_TEMPS.map((t) => (
                <button key={t.id} className={`chip ${temp === t.id ? 'chip-on' : ''}`}
                  onClick={() => setTemp(t.id)}>{t.emoji} {t.label}</button>
              ))}
            </div>
            <div className="muted small" style={{ margin: '10px 0 6px' }}>Tingkat manis</div>
            <div className="opt-row">
              {SWEETNESS.map((s) => (
                <button key={s.id} className={`chip ${sweet === s.id ? 'chip-on' : ''}`}
                  onClick={() => setSweet(s.id)}>{s.label}</button>
              ))}
            </div>
          </>
        )}

        <hr className="hr" />
        <div className="between">
          <span className="muted small">Jumlah</span>
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="bold" style={{ fontSize: 18 }}>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>

        <button className="btn btn-brand btn-block" style={{ marginTop: 12 }} onClick={tambah}>
          Tambah {qty} · {rupiah(item.price * qty)}
        </button>
      </div>
    </div>
  );
}

// Kasir input order manual — untuk pelanggan yang tidak scan QR sendiri,
// atau tambahan order ke meja yang sudah jalan. Pakai endpoint POST /api/orders
// yang SAMA dengan yang dipakai halaman menu pelanggan (potong stok resep,
// hitung QRIS dinamis, dsb sudah otomatis ikut, tidak perlu logic baru).
export default function TakeOrder({ onCreated, tambahKe = null, onBatalTambah }) {
  const [tables, setTables] = useState([]);
  const [terpakai, setTerpakai] = useState({}); // table_id -> order_no bill yang masih jalan
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [laris, setLaris] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input order jadi dua langkah: pilih meja dulu, baru menu. Meja yang salah
  // baru ketahuan setelah struk dapur tercetak, jadi langkahnya dipisah supaya
  // tidak terlewat sambil buru-buru mengetuk menu.
  // Pelanggan dulu, baru meja. Kalau ditaruh belakangan, kasir yang sedang
  // dikejar antrian melewatinya — dan jejak kunjungan tamu hilang diam-diam.
  const [tabInput, setTabInput] = useState('pelanggan'); // pelanggan | meja | barcode | menu
  const [pelanggan, setPelanggan] = useState(null);
  const [hadiah, setHadiah] = useState('');   // menu hadiah yang dipilih tamu
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [payment, setPayment] = useState('cashier');
  const [cart, setCart] = useState({});   // cartKey -> qty
  const [notes, setNotes] = useState({}); // cartKey -> catatan
  const [varian, setVarian] = useState(null); // menu yang sedang ditanya variannya
  const [kategoriAktif, setKategoriAktif] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cari, setCari] = useState('');
  const [asal, setAsal] = useState(''); // origin untuk isi barcode; kosong saat SSR

  useEffect(() => { setAsal(window.location.origin); }, []);

  // Meja yang billnya belum ditutup dianggap masih dipakai. Diambil terpisah
  // supaya bisa disegarkan ulang tiap kali kasir kembali ke langkah pilih meja
  // — di jam ramai, meja bisa terisi oleh kasir lain sambil layar ini terbuka.
  const muatTerpakai = useCallback(async () => {
    const { data } = await supabase
      .from('orders').select('id, table_id, order_no')
      .in('status', ['open', 'preparing', 'served']);
    const pakai = {};
    for (const row of data || []) if (row.table_id) pakai[row.table_id] = row.order_no;
    setTerpakai(pakai);
  }, []);

  useEffect(() => {
    (async () => {
      const [t, c, m, l] = await Promise.all([
        supabase.from('tables').select('id, table_number, seats, area, token, active').eq('active', true).order('table_number'),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').eq('available', true).order('sort_order'),
        fetch('/api/menu/laris?hari=30&jumlah=12').then((r) => r.json()).catch(() => ({ laris: [] })),
        muatTerpakai(),
      ]);
      setTables(t.data || []);
      setCategories(c.data || []);
      setMenuItems(m.data || []);
      setLaris(l.laris || []);
      setLoading(false);
    })();
  }, [muatTerpakai]);

  // Datang dari tombol "Tambah Pesanan" di kartu bill: mejanya sudah pasti,
  // jadi langsung dipilihkan. Menunggu daftar meja selesai dimuat, kalau tidak
  // pilihannya tertimpa nilai kosong.
  useEffect(() => {
    if (tambahKe?.table_id && tables.length) {
      setTableId(tambahKe.table_id);
      // Mejanya sudah pasti, dan pelanggannya sudah tercatat di bill itu —
      // dua langkah awal tidak ada gunanya lagi.
      setTabInput('menu');
    }
  }, [tambahKe, tables]);

  const itemById = useMemo(() => Object.fromEntries(menuItems.map((i) => [i.id, i])), [menuItems]);

  const cocokCari = useMemo(
    () => menuItems.filter((i) => cocok([i.name, i.description], cari)),
    [menuItems, cari],
  );

  // Menu laris hanya ditampilkan saat tidak sedang mencari atau menyaring
  // kategori — begitu kasir mencari sesuatu, dia sudah tahu apa yang dicari.
  const menuLaris = useMemo(() => {
    if (cari.trim() || kategoriAktif) return [];
    return laris.map((r) => itemById[r.menu_item_id]).filter(Boolean);
  }, [laris, itemById, cari, kategoriAktif]);

  const tampil = useMemo(() => {
    let daftar = cocokCari;
    if (kategoriAktif) daftar = daftar.filter((i) => i.category_id === kategoriAktif);
    return daftar;
  }, [cocokCari, kategoriAktif]);

  const perKategori = useMemo(() => {
    if (cari.trim() || kategoriAktif) return [{ id: '_', name: '', items: tampil }];
    return categories
      .map((c) => ({ ...c, items: tampil.filter((i) => i.category_id === c.id) }))
      .filter((c) => c.items.length);
  }, [categories, tampil, cari, kategoriAktif]);

  // Berapa porsi menu ini di keranjang, digabung dari semua variannya.
  const jumlahPerMenu = useMemo(() => {
    const p = {};
    for (const [k, q] of Object.entries(cart)) {
      if (!(q > 0)) continue;
      const { menuId } = parseCartKey(k);
      p[menuId] = (p[menuId] || 0) + q;
    }
    return p;
  }, [cart]);

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

  function ubahQty(key, delta) {
    setCart((c) => {
      const next = Math.max(0, (c[key] || 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[key]; else copy[key] = next;
      return copy;
    });
  }

  // Satu ketukan pada ubin = satu porsi. Menu bervarian membuka jendela dulu.
  function ketuk(item) {
    if (item.needs_cook_method || item.needs_drink_option) { setVarian(item); return; }
    ubahQty(cartKey(item.id), 1);
  }

  function tambahVarian(pilihan, qty) {
    ubahQty(cartKey(varian.id, pilihan), qty);
    setVarian(null);
  }

  function reset() {
    setCart({}); setNotes({}); setCustomerName(''); setTableId('');
    setPayment('cashier'); setResult(null); setError(''); setCari(''); setKategoriAktif('');
    setTabInput('pelanggan');
    setPelanggan(null); setHadiah('');
    muatTerpakai();
  }

  // Setelah meja dipilih, barcodenya dulu — baru menu.
  //
  // Barcode itu satu-satunya cara tamu memanggil waiter dari mejanya. Kalau
  // langkah ini ditaruh setelah order jadi, kasir yang sedang buru-buru
  // melewatkannya, dan tamu baru sadar tidak bisa memanggil siapa pun ketika
  // sudah butuh sesuatu.
  function pilihMeja(t) {
    if (terpakai[t.id]) return;
    setTableId(t.id);
    setError('');
    setTabInput('barcode');
  }

  async function submit() {
    setError('');
    if (!tableId) { setError('Pilih meja dulu.'); setTabInput('meja'); return; }
    if (!cartLines.length) { setError('Belum ada menu dipilih.'); return; }
    // Meja bisa terisi oleh kasir lain sejak layar ini dibuka. Dicegat di sini
    // juga, bukan hanya di tombol pilih meja, supaya order baru tidak menempel
    // ke meja yang billnya masih jalan.
    if (!tambahKe && terpakai[tableId]) {
      setError(`Meja itu sudah dipakai bill #${terpakai[tableId]}. Pilih meja lain, atau tambahkan lewat kartu bill di tab Bill.`);
      setTabInput('meja');
      return;
    }
    const table = tables.find((t) => t.id === tableId);
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: table.token,
          // Kalau menambah ke bill tertentu, tunjuk billnya langsung supaya
          // tidak tertebak salah oleh sistem.
          order_id: tambahKe?.id || undefined,
          customer_name: customerName || pelanggan?.name || '',
          customer_id: pelanggan?.id || null,
          payment_method: payment,
          items: [
            ...cartLines.map((l) => ({
              menu_item_id: l.item.id,
              qty: l.qty,
              note: l.note,
              cook_method: l.method,
              drink_temp: l.temp,
              sweetness: l.sweet,
            })),
            ...(menuHadiah ? [{ menu_item_id: menuHadiah.id, qty: 1, hadiah: true }] : []),
          ],
        }),
      });
      const data = await bacaJson(res);
      if (!res.ok) throw new Error(data.error || 'Gagal membuat order');

      // Hadiah ditandai terpakai SESUDAH ordernya benar-benar jadi. Kalau
      // ditandai lebih dulu lalu ordernya gagal, hak tamu hangus tanpa dia
      // pernah menerima apa pun.
      if (menuHadiah && pelanggan?.id) {
        try {
          await fetch(`/api/customers/${pelanggan.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ klaim_hadiah: menuHadiah.name }),
          });
        } catch { /* hadiah sudah terlanjur masuk order; jangan gagalkan kasir */ }
      }

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
        <div className="h2" style={{ color: '#16794a' }}>
          {tambahKe ? `✓ Ditambahkan ke bill #${result.order_no}` : `✓ Order #${result.order_no} dibuat`}
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>
          Meja {result.table_number} · {tambahKe ? 'tambahan' : 'total'} {rupiah(total)}
        </p>
        {tambahKe && (
          <p className="small" style={{ marginTop: 4 }}>
            Cetak struk dapur di bawah — yang tercetak hanya pesanan tambahan ini,
            bukan seluruh isi bill.
          </p>
        )}
        <div className="col" style={{ gap: 8, marginTop: 10 }}>
          <Link href={`/cashier/barcode/${result.order_id}`} target="_blank" className="btn btn-brand btn-block">
            🔳 Cetak Barcode Meja (Meja {result.table_number} · #{result.order_no})
          </Link>
          <Link href={`/order/${result.order_id}`} target="_blank" className="btn btn-block">Buka Halaman Order (QRIS/status)</Link>
          <Link href={`/kitchen/print/${result.order_id}`} target="_blank" className="btn btn-block">🖨️ Struk Dapur</Link>
          <Link href={`/nota/${result.order_id}`} target="_blank" className="btn btn-block">🧾 Cetak Nota</Link>
          <button className="btn btn-block" onClick={() => { reset(); if (onCreated) onCreated(); }}>Selesai, kembali ke Bill</button>
          <button className="btn" onClick={reset}>+ Input order lain</button>
        </div>
      </div>
    );
  }

  const mejaTerpilih = tables.find((t) => t.id === tableId);
  const daftarMeja = urutkanMeja(tables);
  const mejaKosong = daftarMeja.filter((t) => !terpakai[t.id]).length;

  return (
    <>
      {varian && (
        <PilihVarian item={varian} onTambah={tambahVarian} onTutup={() => setVarian(null)} />
      )}

      <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        <button
          className={`btn ${tabInput === 'pelanggan' ? 'btn-brand' : ''}`}
          disabled={!!tambahKe}
          onClick={() => setTabInput('pelanggan')}
        >
          1. Pelanggan{pelanggan ? ` · ${pelanggan.name}` : ''}
        </button>
        <button
          className={`btn ${tabInput === 'meja' ? 'btn-brand' : ''}`}
          disabled={!!tambahKe}
          onClick={() => { setTabInput('meja'); muatTerpakai(); }}
        >
          2. Pilih Meja{mejaTerpilih ? ` · Meja ${mejaTerpilih.table_number}` : ''}
        </button>
        <button
          className={`btn ${tabInput === 'barcode' ? 'btn-brand' : ''}`}
          disabled={!!tambahKe || !mejaTerpilih}
          onClick={() => setTabInput('barcode')}
        >
          3. Barcode Meja
        </button>
        <button
          className={`btn ${tabInput === 'menu' ? 'btn-brand' : ''}`}
          onClick={() => setTabInput('menu')}
        >
          4. Menu &amp; Keranjang{totalQty > 0 ? ` (${totalQty})` : ''}
        </button>
      </div>

      {tabInput === 'pelanggan' && (
        <PilihPelanggan
          onPilih={(c) => { setPelanggan(c); setTabInput('meja'); muatTerpakai(); }}
        />
      )}

      {tabInput === 'barcode' && mejaTerpilih && (
        <div className="card">
          <div className="h2" style={{ marginBottom: 4 }}>
            🔖 Barcode Meja {mejaTerpilih.table_number}
          </div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Cetak dan taruh di mejanya <b>sebelum</b> mencatat pesanan. Lewat barcode
            ini tamu memanggil waiter dan melihat pesanannya sendiri.
          </p>

          <div className="row" style={{ flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            {asal && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/qr?size=180&data=${encodeURIComponent(`${asal}/meja/${mejaTerpilih.token}`)}`}
                alt={`Barcode meja ${mejaTerpilih.table_number}`}
                style={{ width: 150, height: 150, background: '#fff', padding: 8, borderRadius: 10 }}
              />
            )}
            <div className="col" style={{ gap: 8, minWidth: 220, flex: 1 }}>
              <Link href={`/admin/qr/${mejaTerpilih.token}`} target="_blank"
                className="btn btn-brand btn-block">
                🖨️ Cetak Barcode Meja {mejaTerpilih.table_number}
              </Link>
              <Link href={`/meja/${mejaTerpilih.token}`} target="_blank" className="btn btn-block">
                👁️ Lihat yang dilihat tamu
              </Link>
              <button className="btn btn-block" onClick={() => setTabInput('menu')}>
                Lanjut ke Menu →
              </button>
              <button className="btn" style={{ padding: '4px 10px', fontSize: 13 }}
                onClick={() => { setTabInput('meja'); muatTerpakai(); }}>
                ← Ganti meja
              </button>
            </div>
          </div>
        </div>
      )}

      {tabInput === 'meja' && (
        <div className="card">
          <div className="between" style={{ marginBottom: 4 }}>
            <div className="h2">🪑 Pilih Meja</div>
            <span className="muted small">{mejaKosong} dari {daftarMeja.length} meja kosong</span>
          </div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Meja yang billnya belum ditutup tidak bisa dipilih. Untuk menambah
            pesanan ke meja itu, pakai tombol <b>Tambah Pesanan</b> di kartu billnya
            pada tab Bill supaya masuk ke tagihan yang sama.
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' }}>
            {daftarMeja.map((t) => {
              const isi = terpakai[t.id];
              return (
                <button
                  key={t.id}
                  className={`btn ${tableId === t.id ? 'btn-brand' : ''}`}
                  disabled={!!isi}
                  style={{
                    flexDirection: 'column', gap: 4, padding: '14px 8px',
                    opacity: isi ? 0.55 : 1, cursor: isi ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => pilihMeja(t)}
                >
                  <span className="bold" style={{ fontSize: 18 }}>Meja {t.table_number}</span>
                  {isi
                    ? <span className="badge badge-amber">terisi #{isi}</span>
                    : <span className="badge badge-green">kosong</span>}
                  {t.seats ? <span className="muted small">{t.seats} kursi</span> : null}
                </button>
              );
            })}
          </div>

          {daftarMeja.length === 0 && (
            <p className="muted small" style={{ margin: 0 }}>Belum ada meja aktif.</p>
          )}

          {error && <p className="small" style={{ color: '#c0271f', marginTop: 10 }}>{error}</p>}
        </div>
      )}

      <div className="papan-kasir" style={tabInput === 'menu' ? undefined : { display: 'none' }}>
        {/* ---------- kiri: pemilihan menu ---------- */}
        <div className="col">
          <div className="card" style={{ padding: 12 }}>
            <input
              className="input" type="search"
              placeholder="Cari menu… (mis. karubi, teh, sate)"
              value={cari} onChange={(e) => setCari(e.target.value)}
            />
            <div className="rak-kategori" style={{ marginTop: 8 }}>
              <button className={`chip ${!kategoriAktif ? 'chip-on' : ''}`}
                onClick={() => setKategoriAktif('')}>Semua</button>
              {categories.map((c) => (
                <button key={c.id} className={`chip ${kategoriAktif === c.id ? 'chip-on' : ''}`}
                  onClick={() => setKategoriAktif(kategoriAktif === c.id ? '' : c.id)}>{c.name}</button>
              ))}
            </div>
            {cari.trim() && (
              <div className="between" style={{ marginTop: 8 }}>
                <span className="muted small">{cocokCari.length} dari {menuItems.length} menu</span>
                <button className="btn" style={{ padding: '4px 10px', fontSize: 13 }}
                  onClick={() => setCari('')}>Hapus pencarian</button>
              </div>
            )}
          </div>

          {menuLaris.length > 0 && (
            <div className="card" style={{ padding: 12, borderColor: 'var(--brand)' }}>
              <div className="between" style={{ marginBottom: 8 }}>
                <div className="h2">⭐ Menu Laris</div>
                <span className="muted small">30 hari terakhir</span>
              </div>
              <div className="ubin-grid">
                {menuLaris.map((it, i) => (
                  <Ubin key={it.id} item={it} jumlah={jumlahPerMenu[it.id] || 0}
                    tanda={i < 3 ? `#${i + 1}` : null} onKlik={() => ketuk(it)} />
                ))}
              </div>
            </div>
          )}

          {tampil.length === 0 && (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                {cari.trim() ? `Tidak ada menu yang cocok dengan “${cari}”.` : 'Tidak ada menu.'}
              </p>
            </div>
          )}

          {perKategori.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: 12 }}>
              {cat.name && <div className="h2" style={{ marginBottom: 8 }}>{cat.name}</div>}
              <div className="ubin-grid">
                {cat.items.map((it) => (
                  <Ubin key={it.id} item={it} jumlah={jumlahPerMenu[it.id] || 0}
                    onKlik={() => ketuk(it)} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- kanan: keranjang & data order ---------- */}
        <div className="col keranjang">
          <div className="card" style={{ padding: 12 }}>
            <div className="between" style={{ marginBottom: 8 }}>
              <div className="h2">🧾 Keranjang {totalQty > 0 && `(${totalQty})`}</div>
              {cartLines.length > 0 && (
                <button className="btn" style={{ padding: '4px 10px', fontSize: 13 }}
                  onClick={() => { setCart({}); setNotes({}); }}>Kosongkan</button>
              )}
            </div>

            {cartLines.length === 0 && (
              <p className="muted small" style={{ margin: 0 }}>
                Ketuk menu di sebelah kiri untuk menambahkan.
              </p>
            )}

            {cartLines.map((l) => {
              const label = variantLabels({
                cook_method: l.method, drink_temp: l.temp, sweetness: l.sweet,
              }, { emoji: false });
              return (
                <div key={l.key} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
                  <div className="between">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="small bold">{l.item.name}</div>
                      {label.length > 0 && (
                        <div className="muted small">{label.join(' · ')}</div>
                      )}
                      <div className="muted small">{rupiah(l.item.price * l.qty)}</div>
                    </div>
                    <div className="qty">
                      <button onClick={() => ubahQty(l.key, -1)}>−</button>
                      <span className="bold">{l.qty}</span>
                      <button onClick={() => ubahQty(l.key, 1)}>+</button>
                    </div>
                  </div>
                  <input
                    className="input" style={{ marginTop: 6, padding: '6px 10px', fontSize: 13 }}
                    placeholder="Catatan (opsional)"
                    value={notes[l.key] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [l.key]: e.target.value }))}
                  />
                </div>
              );
            })}

            {cartLines.length > 0 && (
              <>
                <div className="between small" style={{ marginTop: 10 }}>
                  <span className="muted">Subtotal</span><span>{rupiah(subtotal)}</span>
                </div>
                {pb1 > 0 && (
                  <div className="between small"><span className="muted">PB1 {pb1}%</span><span>{rupiah(tax)}</span></div>
                )}
                <div className="between bold" style={{ marginTop: 4, fontSize: 17 }}>
                  <span>Total</span><span>{rupiah(total)}</span>
                </div>
              </>
            )}
          </div>

          {pelanggan?.berhak_hadiah && (
            <div className="card" style={{ padding: 12, borderColor: '#d99411' }}>
              <div className="bold">🎁 Hadiah kunjungan ke-{KUNJUNGAN_HADIAH}</div>
              <p className="muted small" style={{ margin: '4px 0 8px' }}>
                {pelanggan.name} sudah datang {pelanggan.visit_count}×. Tawarkan satu menu gratis.
              </p>
              <div className="opt-row">
                {MENU_HADIAH.map((h) => (
                  <button key={h} type="button"
                    className={`chip ${hadiah === h ? 'chip-on' : ''}`}
                    onClick={() => setHadiah(hadiah === h ? '' : h)}>
                    {h}
                  </button>
                ))}
              </div>
              {hadiah && (
                <p className="small" style={{ margin: '8px 0 0', color: '#16794a' }}>
                  ✓ {hadiah} akan masuk order dengan harga Rp 0 dan tercetak ke dapur.
                </p>
              )}
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                Hadiah hanya sekali seumur pelanggan. Kalau tamu menolak, biarkan kosong —
                haknya tidak hangus.
              </p>
            </div>
          )}

          <div className="card" style={{ padding: 12, borderColor: tambahKe ? 'var(--brand)' : undefined }}>
            {tambahKe && (
              <div style={{ marginBottom: 10 }}>
                <div className="bold">➕ Tambahan untuk bill #{tambahKe.order_no}</div>
                <div className="muted small">
                  Meja {tambahKe.table_number} · masuk ke tagihan yang sama, bukan bill baru
                </div>
                {tambahKe.paid && (
                  <p className="small" style={{ margin: '6px 0 0', color: '#9a6b06' }}>
                    ⚠ Bill ini sudah ditandai <b>lunas</b>. Tambahan ini akan membuat
                    tagihannya bertambah lagi — tagih selisihnya sebelum tamu pulang.
                  </p>
                )}
                {onBatalTambah && (
                  <button className="btn" style={{ padding: '4px 10px', fontSize: 13, marginTop: 6 }}
                    onClick={onBatalTambah}>Batal, buat order baru saja</button>
                )}
              </div>
            )}
            <div className="col" style={{ gap: 8 }}>
              {/* Saat menambah ke bill tertentu, mejanya tidak boleh diganti —
                  salah meja di sini berarti tagihan menempel ke tamu lain. */}
              {/* Meja dipilih di langkah 1; di sini cuma ditegaskan lagi supaya
                  kasir tidak perlu pindah tab untuk memastikan. */}
              {tambahKe ? (
                <div className="input" style={{ opacity: 0.75 }}>Meja {tambahKe.table_number}</div>
              ) : (
                <div className="between">
                  <span className={mejaTerpilih ? 'bold' : 'muted'}>
                    {mejaTerpilih ? `Meja ${mejaTerpilih.table_number}` : 'Meja belum dipilih'}
                  </span>
                  <button
                    className="btn" style={{ padding: '6px 10px', fontSize: 13 }}
                    onClick={() => { setTabInput('meja'); muatTerpakai(); }}
                  >
                    {mejaTerpilih ? 'Ganti meja' : 'Pilih meja'}
                  </button>
                </div>
              )}
              <input className="input" placeholder="Nama pelanggan (opsional)"
                value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <div className="row" style={tambahKe ? { display: 'none' } : undefined}>
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

            {error && <p className="small" style={{ color: '#c0271f', marginTop: 8 }}>{error}</p>}

            <button className="btn btn-brand btn-block" style={{ marginTop: 10 }}
              disabled={submitting || !cartLines.length} onClick={submit}>
              {submitting
                ? 'Memproses…'
                : `${tambahKe ? 'Tambahkan ke Bill' : 'Buat Order'} · ${rupiah(total)}`}
            </button>
          </div>
        </div>
      </div>

      {cartLines.length > 0 && tabInput === 'menu' && (
        <div className="bar-keranjang">
          <div>
            <div className="bold" style={{ fontSize: 17 }}>{rupiah(total)}</div>
            <div className="muted small">{totalQty} porsi di keranjang</div>
          </div>
          <button
            className="btn btn-brand"
            onClick={() => document.querySelector('.keranjang')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Lihat keranjang →
          </button>
        </div>
      )}
    </>
  );
}
