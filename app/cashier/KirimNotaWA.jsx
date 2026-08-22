'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { taxPercent } from '../../lib/tax';
import { nomorWA, linkWA } from '../../lib/wa';
import { notaTeksWA } from '../../lib/notaWA';
import { gambarNota, nulisBlob } from '../../lib/notaGambar';

// Kirim nota ke WhatsApp tamu.
//
// Lewat wa.me (click-to-chat), bukan API berbayar: kasir menekan tombol,
// WhatsApp terbuka dengan nomor dan isi nota sudah terisi, tinggal tekan
// kirim. Satu ketukan manual, tapi tidak ada biaya per pesan dan tidak perlu
// tamu opt-in lebih dulu seperti API resmi WhatsApp Business.
export default function KirimNotaWA({ order, onTutup }) {
  const [items, setItems] = useState([]);
  const [hp, setHp] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [muat, setMuat] = useState(true);
  const [asal, setAsal] = useState('');
  const [sibuk, setSibuk] = useState('');
  const [pesanGambar, setPesanGambar] = useState('');

  useEffect(() => { setAsal(window.location.origin); }, []);

  useEffect(() => {
    (async () => {
      const [it, pel] = await Promise.all([
        supabase.from('order_items')
          .select('name, qty, price, discount, discount_note, cook_method, drink_temp, sweetness, cancelled_at')
          .eq('order_id', order.id).order('created_at'),
        // Nomornya diambil dari pelanggan yang tertaut di bill — kasir tidak
        // perlu mengetik ulang nomor yang tadi sudah dicari di langkah 1.
        order.customer_id
          ? supabase.from('customers').select('name, phone').eq('id', order.customer_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setItems((it.data || []).filter((x) => !x.cancelled_at));
      if (pel.data) { setHp(pel.data.phone); setNamaPelanggan(pel.data.name); }
      setMuat(false);
    })();
  }, [order.id, order.customer_id]);

  const teks = useMemo(() => notaTeksWA({
    order,
    items,
    merchant: process.env.NEXT_PUBLIC_MERCHANT_NAME || 'BBQIU',
    persenPajak: taxPercent(),
    tautan: asal ? `${asal}/nota/${order.id}` : '',
  }), [order, items, asal]);

  const nomor = nomorWA(hp);
  const tautan = nomor ? linkWA(hp, teks) : null;

  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'BBQIU';

  function buatBerkas() {
    const kanvas = gambarNota({ order, items, merchant, persenPajak: taxPercent() });
    return nulisBlob(kanvas).then((blob) =>
      new File([blob], `Nota-${order.order_no}-Meja-${order.table_number}.jpg`, { type: 'image/jpeg' }));
  }

  // Lampiran hanya bisa lewat lembar bagikan bawaan sistem. wa.me tidak
  // menerima berkas sama sekali, jadi tidak ada jalan mengirim gambar
  // langsung ke satu nomor tanpa API berbayar — tujuannya dipilih kasir di
  // lembar bagikan itu.
  async function bagikanGambar() {
    setPesanGambar(''); setSibuk('bagikan');
    try {
      const file = await buatBerkas();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Nota #${order.order_no}` });
        setPesanGambar('Lembar bagikan terbuka — pilih WhatsApp, lalu pilih nomor tamunya.');
      } else {
        unduh(file);
        setPesanGambar(
          'Perangkat ini tidak mendukung bagikan berkas. Gambarnya sudah diunduh — ' +
          'lampirkan manual di WhatsApp.'
        );
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setPesanGambar(e?.message || 'Gagal membuat gambar nota.');
    } finally { setSibuk(''); }
  }

  function unduh(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function unduhGambar() {
    setPesanGambar(''); setSibuk('unduh');
    try {
      unduh(await buatBerkas());
      setPesanGambar('Gambar nota tersimpan di folder Unduhan.');
    } catch (e) {
      setPesanGambar(e?.message || 'Gagal membuat gambar nota.');
    } finally { setSibuk(''); }
  }

  return (
    <div className="tirai" onClick={onTutup}>
      <div className="card kotak" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <div>
            <div className="h2">📱 Kirim Nota via WhatsApp</div>
            <div className="muted small">
              Bill #{order.order_no} · Meja {order.table_number}
              {namaPelanggan ? ` · ${namaPelanggan}` : ''}
            </div>
          </div>
          <button className="btn" onClick={onTutup}>✕</button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="muted small">Nomor WhatsApp tamu</div>
          <input className="input" inputMode="tel" placeholder="081234567890"
            value={hp} onChange={(e) => setHp(e.target.value)} style={{ fontSize: 17 }} />
          {hp && !nomor && (
            <p className="small" style={{ color: '#c0271f', marginTop: 6 }}>
              Nomor tidak dikenali. Tulis seperti 081234567890.
            </p>
          )}
          {!order.customer_id && (
            <p className="muted small" style={{ marginTop: 6 }}>
              Bill ini tidak tertaut ke pelanggan terdaftar, jadi nomornya diisi manual.
            </p>
          )}
        </div>

        <hr className="hr" />
        <div className="muted small" style={{ marginBottom: 6 }}>Isi pesan</div>
        {muat ? (
          <p className="muted small" style={{ margin: 0 }}>Memuat isi nota…</p>
        ) : (
          <pre style={{
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
            background: 'rgba(0,0,0,.05)', padding: 10, borderRadius: 8,
            maxHeight: 260, overflowY: 'auto',
          }}>{teks}</pre>
        )}

        <a
          href={tautan || undefined}
          target="_blank" rel="noreferrer"
          className={`btn btn-brand btn-block ${tautan ? '' : 'disabled'}`}
          style={{ marginTop: 12, opacity: tautan ? 1 : 0.5, pointerEvents: tautan ? 'auto' : 'none' }}
          onClick={() => setTimeout(onTutup, 400)}
        >
          💬 Buka WhatsApp &amp; Kirim
        </a>
        <p className="muted small" style={{ marginTop: 8 }}>
          WhatsApp akan terbuka dengan pesan sudah terisi. Tekan kirim di sana —
          pesan tidak terkirim sendiri.
        </p>

        <hr className="hr" />
        <div className="muted small" style={{ marginBottom: 6 }}>Kirim sebagai gambar</div>
        <div className="row">
          <button className="btn btn-block" disabled={!!sibuk || muat} onClick={bagikanGambar}>
            {sibuk === 'bagikan' ? 'Menyiapkan…' : '🖼️ Bagikan Gambar Nota'}
          </button>
          <button className="btn btn-block" disabled={!!sibuk || muat} onClick={unduhGambar}>
            {sibuk === 'unduh' ? 'Menyiapkan…' : '⬇️ Unduh JPG'}
          </button>
        </div>
        {pesanGambar && (
          <p className="small" style={{ marginTop: 8, color: '#16794a' }}>{pesanGambar}</p>
        )}
        <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
          Lampiran tidak bisa lewat tautan WhatsApp, jadi gambarnya diserahkan ke
          lembar <b>bagikan</b> bawaan HP — pilih WhatsApp di situ, lalu pilih nomor
          tamunya. Untuk PDF, pakai tombol <b>🧾 Nota</b> lalu Cetak → Simpan sebagai PDF.
        </p>
      </div>
    </div>
  );
}
