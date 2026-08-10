'use client';

import { useState } from 'react';

// Tombol cetak untuk printer struk bluetooth 58mm.
//
// window.print() TIDAK bisa dipakai untuk printer bluetooth 58mm: printer
// jenis ini berbicara ESC/POS lewat Bluetooth Classic (SPP), sedangkan
// dialog cetak browser hanya melihat printer yang terdaftar di kerangka
// cetak Android. Printer yang dipasangkan lewat menu Bluetooth biasa tidak
// ada di sana — itulah kenapa yang muncul cuma "Simpan sebagai PDF" atau
// langsung error. Jadi perintah cetaknya dikirim langsung sebagai byte.
//
// Dua jalur, karena tidak ada satu jalur yang bekerja di semua printer:
//   RawBT      — aplikasi Android gratis, mendukung printer SPP (mayoritas
//                printer 58mm murah). Jalur yang paling sering berhasil.
//   Bluetooth  — Web Bluetooth langsung dari Chrome, hanya untuk printer BLE
//                dan wajib HTTPS. Tanpa aplikasi tambahan bila didukung.

const SERVICE_PRINTER = '000018f0-0000-1000-8000-00805f9b34fb';
const CHAR_TULIS = '00002af1-0000-1000-8000-00805f9b34fb';

// Perangkat disimpan supaya cetakan berikutnya tidak memunculkan dialog
// pemilihan printer lagi selama tab belum ditutup.
let perangkatTersimpan = null;

async function kirimViaBluetooth(bytes) {
  if (!navigator.bluetooth) {
    throw new Error(
      'Browser ini tidak mendukung Web Bluetooth. Pakai Chrome di Android, ' +
      'atau gunakan tombol RawBT.'
    );
  }
  if (!window.isSecureContext) {
    throw new Error('Web Bluetooth hanya jalan lewat HTTPS.');
  }

  let dev = perangkatTersimpan;
  if (!dev || !dev.gatt) {
    dev = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_PRINTER] }],
      optionalServices: [SERVICE_PRINTER],
    });
    perangkatTersimpan = dev;
  }

  const server = await dev.gatt.connect();
  const svc = await server.getPrimaryService(SERVICE_PRINTER);
  const ch = await svc.getCharacteristic(CHAR_TULIS);

  // BLE hanya menerima paket kecil; dikirim bertahap dengan jeda supaya
  // penyangga printer tidak kepenuhan dan cetakannya tidak terpotong.
  const POTONG = 180;
  for (let i = 0; i < bytes.length; i += POTONG) {
    const bagian = bytes.slice(i, i + POTONG);
    if (ch.writeValueWithoutResponse) await ch.writeValueWithoutResponse(bagian);
    else await ch.writeValue(bagian);
    await new Promise((r) => setTimeout(r, 30));
  }
}

export default function CetakTermal({ buatStruk, judul = 'Cetak Struk' }) {
  const [pesan, setPesan] = useState('');
  const [error, setError] = useState('');
  const [sibuk, setSibuk] = useState('');

  function bersih() { setPesan(''); setError(''); }

  function cetakRawBT() {
    bersih();
    try {
      const s = buatStruk();
      // RawBT menangkap skema rawbt: dan meneruskan byte mentahnya ke
      // printer yang sudah dipasangkan di aplikasi itu.
      window.location.href = `rawbt:base64,${s.base64()}`;
      setPesan(
        'Perintah cetak dikirim ke RawBT. Kalau tidak ada yang terjadi, ' +
        'aplikasi RawBT belum terpasang — pasang dulu dari Play Store, ' +
        'lalu pilih printer 58mm Anda di dalamnya.'
      );
    } catch (e) { setError(e.message); }
  }

  async function cetakBluetooth() {
    bersih();
    setSibuk('bt');
    try {
      await kirimViaBluetooth(buatStruk().bytes());
      setPesan('Struk terkirim ke printer ✓');
    } catch (e) {
      // Pembatalan dialog pemilihan printer bukan kegagalan.
      if (e?.name === 'NotFoundError') setError('Tidak ada printer dipilih.');
      else setError(e.message || 'Gagal mengirim ke printer.');
      perangkatTersimpan = null;
    } finally { setSibuk(''); }
  }

  return (
    <div className="card no-print" style={{ marginBottom: 12 }}>
      <div className="h2" style={{ marginBottom: 8, fontSize: 15 }}>🖨️ {judul}</div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-brand" onClick={cetakRawBT}>
          Cetak ke Printer 58mm (RawBT)
        </button>
        <button className="btn" disabled={sibuk === 'bt'} onClick={cetakBluetooth}>
          {sibuk === 'bt' ? 'Menghubungkan…' : 'Cetak via Bluetooth langsung'}
        </button>
        <button className="btn" onClick={() => window.print()}>
          Cetak lewat browser / PDF
        </button>
      </div>

      {pesan && <p className="small" style={{ marginTop: 8, color: '#16794a' }}>{pesan}</p>}
      {error && <p className="small" style={{ marginTop: 8, color: '#c0271f' }}>{error}</p>}

      <details style={{ marginTop: 10 }}>
        <summary className="muted small" style={{ cursor: 'pointer' }}>
          Printer bluetooth-nya error? Baca ini
        </summary>
        <div className="muted small" style={{ marginTop: 6 }}>
          <p style={{ margin: '0 0 6px' }}>
            Tombol <b>Cetak lewat browser</b> hampir selalu gagal untuk printer
            bluetooth 58mm, dan itu bukan salah printernya. Android hanya mau
            mencetak ke printer yang terdaftar sebagai <i>print service</i>;
            printer yang dipasangkan lewat menu Bluetooth biasa tidak terdaftar
            di sana, jadi dialog cetaknya cuma menawarkan “Simpan sebagai PDF”.
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <b>Cara yang dianjurkan:</b> pasang aplikasi <b>RawBT</b> dari Play
            Store (gratis), buka sekali, pilih printer 58mm Anda di sana, lalu
            pakai tombol RawBT di atas. Sesudah itu tinggal sekali sentuh
            tiap mau mencetak.
          </p>
          <p style={{ margin: 0 }}>
            <b>Cetak via Bluetooth langsung</b> hanya bekerja pada printer
            model BLE dan wajib lewat HTTPS. Kalau printer Anda tidak muncul di
            daftar, berarti modelnya Bluetooth Classic — pakai RawBT.
          </p>
        </div>
      </details>
    </div>
  );
}
