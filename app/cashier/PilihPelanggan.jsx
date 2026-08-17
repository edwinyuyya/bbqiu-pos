'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { bacaJson } from '../../lib/bacaJson';
import { KUNJUNGAN_HADIAH } from '../../lib/pelanggan';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function tglID(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

// Langkah pertama kasir: cari pelanggan lewat nomor WA, daftarkan kalau belum ada.
//
// Nomor dicari LEBIH DULU, bukan nama. Nama kembar itu biasa ("Budi" ada
// belasan) dan tamu yang sudah terdaftar akan didaftar ulang oleh kasir yang
// tidak menemukan namanya — jejak kunjungannya lalu terpecah dua dan hadiahnya
// tidak pernah tercapai.
export default function PilihPelanggan({ onPilih }) {
  const [hp, setHp] = useState('');
  const [cari, setCari] = useState(false);
  const [hasil, setHasil] = useState(null);   // { customer, nomor_valid }
  const [nama, setNama] = useState('');
  const [lahir, setLahir] = useState('');
  const [simpan, setSimpan] = useState(false);
  const [error, setError] = useState('');
  const [profil, setProfil] = useState(null);

  const bersihHp = useMemo(() => hp.replace(/[^0-9+]/g, ''), [hp]);

  // Pencarian jalan sendiri saat nomornya sudah cukup panjang — kasir tidak
  // perlu menekan tombol cari di tengah antrian.
  const cariNomor = useCallback(async (nomor) => {
    if (nomor.replace(/\D/g, '').length < 9) { setHasil(null); setProfil(null); return; }
    setCari(true); setError('');
    try {
      const r = await fetch(`/api/customers?phone=${encodeURIComponent(nomor)}`);
      const d = await bacaJson(r);
      setHasil(d);
      if (d.customer) muatProfil(d.customer.id);
      else setProfil(null);
    } catch (e) { setError(e.message); }
    finally { setCari(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cariNomor(bersihHp), 350);
    return () => clearTimeout(t);
  }, [bersihHp, cariNomor]);

  async function muatProfil(id) {
    try {
      const r = await fetch(`/api/customers/${id}`);
      setProfil(await bacaJson(r));
    } catch { setProfil(null); }
  }

  async function daftar() {
    setError('');
    if (!nama.trim()) { setError('Nama pelanggan wajib diisi.'); return; }
    setSimpan(true);
    try {
      const r = await fetch('/api/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nama, phone: bersihHp, birth_date: lahir || null }),
      });
      const d = await bacaJson(r);
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan pelanggan');
      onPilih(d.customer);
    } catch (e) { setError(e.message); }
    finally { setSimpan(false); }
  }

  const c = hasil?.customer;
  const belumKetemu = hasil && hasil.nomor_valid && !c;

  return (
    <div className="card">
      <div className="h2" style={{ marginBottom: 4 }}>👤 Pelanggan</div>
      <p className="muted small" style={{ marginTop: 0 }}>
        Cari nomor WhatsApp-nya dulu. Kalau sudah pernah terdaftar, tidak perlu isi ulang.
      </p>

      <input
        className="input" inputMode="tel" autoFocus
        placeholder="Nomor WhatsApp — mis. 081234567890"
        value={hp} onChange={(e) => setHp(e.target.value)}
        style={{ fontSize: 17 }}
      />

      {cari && <p className="muted small" style={{ marginTop: 6 }}>Mencari…</p>}
      {error && <p className="small" style={{ color: '#c0271f', marginTop: 6 }}>{error}</p>}

      {/* ---------- sudah terdaftar ---------- */}
      {c && (
        <div className="card" style={{ marginTop: 10, borderColor: 'var(--green)' }}>
          <div className="between">
            <div>
              <div className="bold" style={{ fontSize: 18 }}>{c.name}</div>
              <div className="muted small">{c.phone}{c.birth_date ? ` · lahir ${tglID(c.birth_date)}` : ''}</div>
            </div>
            <span className="badge badge-green">{c.visit_count}× datang</span>
          </div>

          {c.berhak_hadiah && (
            <div className="card" style={{ marginTop: 8, borderColor: '#d99411', background: 'rgba(217,148,17,.12)' }}>
              <b>🎁 Berhak hadiah kunjungan ke-{KUNJUNGAN_HADIAH}</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                Tawarkan satu menu gratis. Pilihannya muncul di layar keranjang nanti.
              </p>
            </div>
          )}
          {!c.berhak_hadiah && c.sisa_menuju_hadiah > 0 && (
            <p className="muted small" style={{ marginTop: 6 }}>
              {c.sisa_menuju_hadiah} kunjungan lagi menuju hadiah.
            </p>
          )}
          {c.reward_claimed_at && (
            <p className="muted small" style={{ marginTop: 6 }}>
              Hadiah sudah pernah diambil{c.reward_item ? ` (${c.reward_item})` : ''}.
            </p>
          )}

          {profil?.favorit?.length > 0 && (
            <>
              <hr className="hr" />
              <div className="muted small" style={{ marginBottom: 4 }}>Sering dipesan</div>
              <div className="opt-row">
                {profil.favorit.slice(0, 6).map((f) => (
                  <span key={f.nama} className="chip">{f.nama} <b>{f.porsi}×</b></span>
                ))}
              </div>
            </>
          )}

          {profil?.orders?.length > 0 && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Terakhir datang {tglID(profil.orders[0].created_at)} · total belanja {rupiah(profil.total_belanja)}
            </p>
          )}

          <button className="btn btn-brand btn-block" style={{ marginTop: 10 }}
            onClick={() => onPilih(c)}>
            Lanjut — Pilih Meja →
          </button>
        </div>
      )}

      {/* ---------- belum terdaftar ---------- */}
      {belumKetemu && (
        <div className="card" style={{ marginTop: 10, borderColor: 'var(--brand)' }}>
          <b>Nomor ini belum terdaftar</b>
          <p className="muted small" style={{ margin: '4px 0 8px' }}>
            Isi namanya, lalu tekan Tambahkan Pelanggan.
          </p>
          <div className="col" style={{ gap: 8 }}>
            <input className="input" placeholder="Nama pelanggan" value={nama}
              onChange={(e) => setNama(e.target.value)} />
            <div>
              <div className="muted small">Tanggal lahir (opsional)</div>
              <input className="input" type="date" value={lahir}
                onChange={(e) => setLahir(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-brand btn-block" style={{ marginTop: 10 }}
            disabled={simpan} onClick={daftar}>
            {simpan ? 'Menyimpan…' : `➕ Tambahkan Pelanggan${nama.trim() ? ` — ${nama.trim()}` : ''}`}
          </button>
        </div>
      )}

      {hasil && !hasil.nomor_valid && bersihHp.replace(/\D/g, '').length >= 9 && (
        <p className="small" style={{ color: '#c0271f', marginTop: 8 }}>
          Nomor tidak dikenali. Tulis seperti 081234567890.
        </p>
      )}

      <hr className="hr" />
      <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
        Data dipakai untuk program pelanggan BBQIU (hadiah kunjungan &amp; ucapan
        ulang tahun). Sampaikan ke tamu, dan hormati kalau menolak.
      </p>
    </div>
  );
}
