'use client';

import { useState } from 'react';
import { BRAND, PAKET_MITRA, SKEMA_KERJASAMA, waLink } from '../../../lib/situs';

const KOSONG = { nama: '', hp: '', kota: '', skema: SKEMA_KERJASAMA[0].nama, modal: PAKET_MITRA[0].nama, pesan: '' };

export default function FormMitra() {
  const [f, setF] = useState(KOSONG);

  const isi = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const siap = f.nama.trim() && f.hp.trim() && f.kota.trim();

  // Form ini sengaja tidak menyimpan data ke server: prospek kemitraan dijawab
  // manusia lewat WhatsApp, dan menaruh formulir yang tidak pernah dibaca
  // justru membuat calon mitra menunggu balasan yang tak pernah datang.
  function kirim(e) {
    e.preventDefault();
    if (!siap) return;
    const teks = [
      `Halo ${BRAND.nama}, saya tertarik dengan peluang kerjasama.`,
      '',
      `Nama    : ${f.nama}`,
      `No. HP  : ${f.hp}`,
      `Kota    : ${f.kota}`,
      `Skema   : ${f.skema}`,
      `Rencana : ${f.modal}`,
      f.pesan.trim() ? `\nCatatan : ${f.pesan.trim()}` : '',
      '',
      'Mohon dikirimkan proposal lengkapnya. Terima kasih.',
    ].join('\n');
    window.open(waLink(teks), '_blank', 'noopener,noreferrer');
  }

  return (
    <form className="s-card" onSubmit={kirim} style={{ display: 'grid', gap: 14 }}>
      <div>
        <span className="s-chip">Balasan biasanya di hari yang sama</span>
        <h2 className="s-h3" style={{ marginTop: 12, fontSize: 24 }}>Ajukan minat kemitraan</h2>
        <p className="s-p" style={{ marginTop: 8, fontSize: 15 }}>
          Isi data singkat di bawah. Tombolnya akan membuka WhatsApp dengan
          pesan yang sudah tersusun rapi — Anda tinggal menekan kirim.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        <div className="s-field">
          <label className="s-label" htmlFor="m-nama">Nama lengkap *</label>
          <input id="m-nama" className="s-input" value={f.nama} onChange={isi('nama')} placeholder="Nama Anda" required />
        </div>
        <div className="s-field">
          <label className="s-label" htmlFor="m-hp">Nomor WhatsApp *</label>
          <input id="m-hp" className="s-input" value={f.hp} onChange={isi('hp')} placeholder="08xx xxxx xxxx" inputMode="tel" required />
        </div>
        <div className="s-field">
          <label className="s-label" htmlFor="m-kota">Kota / wilayah incaran *</label>
          <input id="m-kota" className="s-input" value={f.kota} onChange={isi('kota')} placeholder="mis. Semarang" required />
        </div>
        <div className="s-field">
          <label className="s-label" htmlFor="m-skema">Skema kerjasama</label>
          <select id="m-skema" className="s-select" value={f.skema} onChange={isi('skema')}>
            {SKEMA_KERJASAMA.map((s) => <option key={s.nama}>{s.nama}</option>)}
          </select>
        </div>
      </div>

      <div className="s-field">
        <label className="s-label" htmlFor="m-modal">Rencana skala</label>
        <select id="m-modal" className="s-select" value={f.modal} onChange={isi('modal')}>
          {PAKET_MITRA.map((p) => <option key={p.nama}>{p.nama}</option>)}
          <option>Belum tahu, mau didiskusikan</option>
        </select>
      </div>

      <div className="s-field">
        <label className="s-label" htmlFor="m-pesan">Ceritakan sedikit (opsional)</label>
        <textarea
          id="m-pesan"
          className="s-textarea"
          value={f.pesan}
          onChange={isi('pesan')}
          placeholder="Punya lokasi? Sudah pernah menjalankan usaha F&B? Kapan rencana buka?"
        />
      </div>

      <button className="s-btn s-btn-primary" type="submit" disabled={!siap}>
        Kirim lewat WhatsApp →
      </button>
      <p className="s-p" style={{ fontSize: 13 }}>
        Data yang Anda isi tidak disimpan di situs ini — semuanya langsung
        dikirim ke WhatsApp tim kemitraan.
      </p>
    </form>
  );
}
