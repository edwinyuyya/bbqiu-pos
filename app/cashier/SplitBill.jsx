'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rupiah } from '../../lib/format';
import { bacaJson } from '../../lib/bacaJson';

// Split bill — satu meja, dua tagihan.
//
// Ada dua kebutuhan yang sering dicampur jadi satu, dan keduanya nyata:
//
//   1. "Pisah item" — tiap orang bayar apa yang dia makan. Ini memindahkan
//      item ke BILL BARU yang berdiri sendiri: bisa dilunasi, ditutup, dan
//      dicetak notanya terpisah. Uangnya benar-benar tercatat dua kali.
//
//   2. "Bagi rata" — satu tagihan dibagi N orang. Di sini tidak ada yang
//      dipindah: tagihannya tetap satu, kasir cuma perlu tahu tiap orang
//      bayar berapa. Membuat bill terpisah untuk kasus ini justru merusak
//      catatan, karena promo dan PB1-nya ikut terpecah tanpa alasan.
//
// Keduanya disediakan supaya kasir tidak memaksakan cara yang salah:
// memisah item hanya untuk membagi rata akan menggeser diskon promo
// (min spend bisa jadi tidak lagi terpenuhi di salah satu bill).
export default function SplitBill({ order, onTutup, onSelesai }) {
  const [mode, setMode] = useState('item'); // item | rata
  const [daftar, setDaftar] = useState([]);
  const [pilih, setPilih] = useState({}); // item_id -> qty yang dipindah
  const [nama, setNama] = useState('');
  const [orang, setOrang] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Item dibaca ulang di sini, bukan diwariskan dari layar bill. Daftar di
  // layar bisa sudah beberapa detik basi, dan memindahkan qty yang sudah
  // tidak ada membuat permintaan ditolak setengah jalan.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('order_items').select('*')
        .eq('order_id', order.id).is('cancelled_at', null)
        .order('created_at', { ascending: true });
      setDaftar(data || []);
    })();
  }, [order.id]);

  function ubah(it, q) {
    const v = Math.max(0, Math.min(Number(it.qty), q));
    setPilih((p) => ({ ...p, [it.id]: v }));
  }

  const ringkas = useMemo(() => {
    let pindah = 0;
    let tinggal = 0;
    let porsiPindah = 0;
    let porsiTinggal = 0;
    for (const it of daftar) {
      const q = Number(pilih[it.id] || 0);
      const sisa = Number(it.qty) - q;
      // Diskon baris dibagi menurut porsinya supaya angka pratinjau tidak
      // jauh dari hasil akhir. Angka pastinya tetap dihitung server.
      const potongPer = Number(it.discount || 0) / Number(it.qty || 1);
      pindah += q * (Number(it.price) - potongPer);
      tinggal += sisa * (Number(it.price) - potongPer);
      porsiPindah += q;
      porsiTinggal += sisa;
    }
    return { pindah, tinggal, porsiPindah, porsiTinggal };
  }, [daftar, pilih]);

  const adaPromo = !!order.promo_code;
  const bisaPisah = ringkas.porsiPindah > 0 && ringkas.porsiTinggal > 0;

  async function pisah() {
    setError('');
    setBusy(true);
    try {
      const items = daftar
        .filter((it) => Number(pilih[it.id] || 0) > 0)
        .map((it) => ({ id: it.id, qty: Number(pilih[it.id]) }));
      const r = await fetch(`/api/orders/${order.id}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, nama_pelanggan: nama.trim() || null }),
      });
      const d = await bacaJson(r);
      if (!r.ok) throw new Error(d.error || 'Gagal memisah bill');
      onSelesai(d);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const n = Math.max(1, Number(orang) || 1);
  const perOrang = Math.ceil(Number(order.total || 0) / n);

  return (
    <div className="tirai" onClick={onTutup}>
      <div className="card kotak" onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <div>
            <div className="h2">🧾 Split Bill</div>
            <div className="muted small">
              Bill #{order.order_no} · Meja {order.table_number} · {rupiah(order.total)}
            </div>
          </div>
          <button className="btn" onClick={onTutup}>✕</button>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button className={`btn btn-block ${mode === 'item' ? 'btn-brand' : ''}`}
            onClick={() => setMode('item')}>Pisah per item</button>
          <button className={`btn btn-block ${mode === 'rata' ? 'btn-brand' : ''}`}
            onClick={() => setMode('rata')}>Bagi rata</button>
        </div>

        {error && <p className="small" style={{ color: '#c0271f', marginTop: 8 }}>{error}</p>}

        {mode === 'rata' && (
          <div style={{ marginTop: 12 }}>
            <label className="small muted">Dibagi berapa orang?</label>
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn" onClick={() => setOrang((v) => Math.max(1, Number(v) - 1))}>−</button>
              <input
                className="input" type="number" min="1" inputMode="numeric"
                style={{ textAlign: 'center', maxWidth: 90 }}
                value={orang} onChange={(e) => setOrang(e.target.value)}
              />
              <button className="btn" onClick={() => setOrang((v) => Number(v) + 1)}>+</button>
            </div>

            <div className="card" style={{ marginTop: 12, background: '#f7f7f7' }}>
              <div className="between"><span className="muted small">Total tagihan</span><b>{rupiah(order.total)}</b></div>
              <div className="between" style={{ marginTop: 6 }}>
                <span className="muted small">Per orang ({n} orang)</span>
                <b style={{ fontSize: 20 }}>{rupiah(perOrang)}</b>
              </div>
              {perOrang * n !== Number(order.total || 0) && (
                <div className="muted small" style={{ marginTop: 6 }}>
                  Dibulatkan ke atas — terkumpul {rupiah(perOrang * n)},
                  lebih {rupiah(perOrang * n - Number(order.total || 0))}.
                </div>
              )}
            </div>

            <p className="muted small" style={{ marginTop: 10 }}>
              Ini hanya hitungan untuk kasir. Tagihannya tetap satu bill dan
              ditandai lunas sekali saja setelah semua uangnya terkumpul.
            </p>
          </div>
        )}

        {mode === 'item' && (
          <div style={{ marginTop: 12 }}>
            <p className="muted small" style={{ marginTop: 0 }}>
              Pilih item yang pindah ke bill baru. Yang tidak dipilih tetap di
              bill #{order.order_no}.
            </p>

            <div className="col" style={{ gap: 6 }}>
              {daftar.map((it) => {
                const q = Number(pilih[it.id] || 0);
                return (
                  <div key={it.id} className="between"
                    style={{ gap: 8, padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="small" style={{ fontWeight: q ? 700 : 400 }}>{it.name}</div>
                      <div className="muted small">
                        {it.qty}× {rupiah(it.price)}
                        {Number(it.discount) > 0 && ` · diskon ${rupiah(it.discount)}`}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                      <button className="btn" style={{ padding: '2px 10px' }}
                        disabled={q <= 0} onClick={() => ubah(it, q - 1)}>−</button>
                      <span className="small" style={{ minWidth: 34, textAlign: 'center' }}>
                        {q} / {it.qty}
                      </span>
                      <button className="btn" style={{ padding: '2px 10px' }}
                        disabled={q >= Number(it.qty)} onClick={() => ubah(it, q + 1)}>+</button>
                      <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }}
                        onClick={() => ubah(it, q >= Number(it.qty) ? 0 : Number(it.qty))}>
                        {q >= Number(it.qty) ? 'batal' : 'semua'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {daftar.length === 0 && (
                <p className="muted small" style={{ margin: 0 }}>Bill ini belum ada isinya.</p>
              )}
            </div>

            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <div className="card btn-block" style={{ background: '#f7f7f7' }}>
                <div className="muted small">Tetap di #{order.order_no}</div>
                <b>{rupiah(Math.round(ringkas.tinggal))}</b>
                <div className="muted small">{ringkas.porsiTinggal} porsi</div>
              </div>
              <div className="card btn-block" style={{ background: '#eef7f1' }}>
                <div className="muted small">Bill baru</div>
                <b>{rupiah(Math.round(ringkas.pindah))}</b>
                <div className="muted small">{ringkas.porsiPindah} porsi</div>
              </div>
            </div>
            <div className="muted small" style={{ marginTop: 4 }}>
              Angka di atas belum termasuk PB1 — dihitung ulang oleh sistem
              setelah dipisah.
            </div>

            <input
              className="input" style={{ marginTop: 10 }}
              placeholder="Nama tamu untuk bill baru (opsional)"
              value={nama} onChange={(e) => setNama(e.target.value)}
            />

            {adaPromo && ringkas.porsiPindah > 0 && (
              <p className="small" style={{ color: '#8a5a00', marginTop: 8 }}>
                ⚠️ Bill ini memakai kode <b>{order.promo_code}</b>. Kodenya
                tetap menempel di bill asal saja — bill baru tidak ikut
                mendapat potongan, dan potongan di bill asal dihitung ulang
                dari isinya yang tersisa.
              </p>
            )}

            <button
              className="btn btn-brand btn-block" style={{ marginTop: 10 }}
              disabled={busy || !bisaPisah}
              onClick={pisah}
            >
              {busy ? 'Memisah…' : 'Pisahkan ke Bill Baru'}
            </button>
            {!bisaPisah && ringkas.porsiPindah > 0 && (
              <p className="muted small" style={{ marginTop: 6 }}>
                Sisakan minimal satu porsi di bill asal — kalau semuanya pindah,
                yang dibutuhkan bukan split bill melainkan pindah meja.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
