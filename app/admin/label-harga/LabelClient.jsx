'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CariBox from '../../components/CariBox';
import { cocok } from '../../../lib/cari';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

const UKURAN = [
  { id: '90', kelas: 'label-90', nama: '90 × 55 mm', ket: 'seukuran kartu nama · 10 per lembar A4', perBaris: 2 },
  { id: '60', kelas: 'label-60', nama: '60 × 40 mm', ket: 'nampan kecil & sate · 21 per lembar A4', perBaris: 3 },
];

// Satu label untuk satu menu. Harga sengaja jadi elemen terbesar: pelanggan
// yang berdiri di depan chiller mencari harga dulu, baru namanya.
function Label({ item, kelas, merchant }) {
  const diskon = Number(item.discount_percent) > 0 ? Number(item.discount_percent) : 0;
  const harga = diskon ? Math.round(item.price * (1 - diskon / 100)) : Number(item.price);

  return (
    <div className={`label-harga ${kelas}`}>
      <div className="kepala">
        <span>{merchant}</span>
        {item.needs_cook_method && <span>GRILL / STEAMBOAT</span>}
      </div>
      <div className="badan">
        <div className="nama">{item.name}</div>
        {item.description && <div className="ket">{item.description}</div>}
        <div className="harga">{rupiah(harga)}</div>
        <div className="kaki">
          <span>per porsi</span>
          {diskon > 0 && <span>coret {rupiah(item.price)} · −{diskon}%</span>}
        </div>
      </div>
    </div>
  );
}

export default function LabelClient({ categories, items, merchant }) {
  // Chiller memajang bahan mentah Grill & Steamboat, jadi kategori itu yang
  // dipilih lebih dulu — tapi tetap bisa diganti untuk sate dan lainnya.
  const bawaan = categories.find((c) => /grill|steamboat/i.test(c.name))?.id || '';
  const [kategori, setKategori] = useState(bawaan);
  const [ukuran, setUkuran] = useState('90');
  const [cari, setCari] = useState('');
  const [dipilih, setDipilih] = useState(() => new Set());

  const daftar = useMemo(() => {
    let d = items;
    if (kategori) d = d.filter((i) => i.category_id === kategori);
    return d.filter((i) => cocok([i.name, i.description], cari));
  }, [items, kategori, cari]);

  // Ganti kategori = mulai pilihan dari nol, karena label kategori lama
  // tidak akan terlihat lagi di daftar dan diam-diam ikut tercetak.
  useEffect(() => { setDipilih(new Set()); }, [kategori]);

  function alih(id) {
    setDipilih((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function pilihSemua() { setDipilih(new Set(daftar.map((i) => i.id))); }
  function kosongkan() { setDipilih(new Set()); }

  const uk = UKURAN.find((u) => u.id === ukuran) || UKURAN[0];
  const cetak = items.filter((i) => dipilih.has(i.id));

  return (
    <div className="container">
      <div className="between no-print" style={{ padding: '16px 0' }}>
        <div>
          <h1 className="title">🏷️ Label Harga Showcase</h1>
          <p className="muted small">Nama &amp; harga untuk dipajang di chiller</p>
        </div>
        <Link href="/admin" className="btn">← Admin</Link>
      </div>

      <div className="card no-print">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <select className="select" style={{ maxWidth: 240 }} value={kategori}
            onChange={(e) => setKategori(e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {UKURAN.map((u) => (
            <button key={u.id} className={`btn ${ukuran === u.id ? 'btn-brand' : ''}`}
              onClick={() => setUkuran(u.id)}>{u.nama}</button>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>{uk.ket}</p>

        <CariBox value={cari} onChange={setCari} placeholder="Cari menu…"
          hasil={daftar.length} total={items.length} style={{ marginTop: 10 }} />

        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={pilihSemua}>Pilih semua ({daftar.length})</button>
          <button className="btn" onClick={kosongkan}>Kosongkan</button>
          <span className="badge">{dipilih.size} label dipilih</span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', marginTop: 12 }}>
          {daftar.map((i) => (
            <label key={i.id} className="card"
              style={{
                padding: '8px 10px', cursor: 'pointer',
                borderColor: dipilih.has(i.id) ? 'var(--brand)' : 'var(--line)',
              }}>
              <div className="row" style={{ gap: 8 }}>
                <input type="checkbox" checked={dipilih.has(i.id)} onChange={() => alih(i.id)} />
                <span style={{ flex: 1 }}>
                  <span className="bold small">{i.name}</span>
                  <div className="muted small">{rupiah(i.price)}</div>
                </span>
              </div>
            </label>
          ))}
          {daftar.length === 0 && (
            <div className="card"><p className="muted" style={{ margin: 0 }}>Tidak ada menu.</p></div>
          )}
        </div>

        <button className="btn btn-brand btn-block" style={{ marginTop: 14 }}
          disabled={!cetak.length} onClick={() => window.print()}>
          🖨️ Cetak {cetak.length} Label
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          Cetak di kertas tebal (mis. 210 gsm) supaya label bisa berdiri sendiri
          di dalam chiller. Kalau ada laminasi, laminasi dulu — chiller berembun
          dan kertas biasa akan melengkung dalam sehari.
        </p>
      </div>

      {cetak.length > 0 && (
        <div className="lembar-label" style={{
          gridTemplateColumns: `repeat(${uk.perBaris}, max-content)`,
          marginTop: 16,
        }}>
          {cetak.map((i) => (
            <Label key={i.id} item={i} kelas={uk.kelas} merchant={merchant} />
          ))}
        </div>
      )}
    </div>
  );
}
