'use client';

import { useMemo, useState } from 'react';
import { paket, tambahan, hargaPerOrang } from '@/data/paket';
import { site, waLink, rupiah } from '@/data/site';

export default function Kalkulator() {
  const [idPaket, setIdPaket] = useState(paket[0].id);
  const [pax, setPax] = useState(2);
  const [pilihTambahan, setPilihTambahan] = useState([]);

  const p = paket.find((x) => x.id === idPaket);

  // Jaga agar jumlah peserta tetap masuk akal untuk paket yang dipilih.
  function gantiPaket(id) {
    const baru = paket.find((x) => x.id === id);
    setIdPaket(id);
    setPax((n) => Math.min(Math.max(n, baru.minPax), baru.maxPax));
  }

  const hitung = useMemo(() => {
    const perOrang = hargaPerOrang(p, pax);
    const dasar = perOrang * pax;

    let biayaTambahan = 0;
    const rincian = [];
    for (const id of pilihTambahan) {
      const t = tambahan.find((x) => x.id === id);
      if (!t) continue;
      // "per orang" dikalikan jumlah peserta, sisanya dihitung sekali.
      const kali = t.satuan.includes('per orang') ? pax : 1;
      const jumlah = t.harga * kali;
      biayaTambahan += jumlah;
      rincian.push({ nama: t.nama, jumlah, kali });
    }

    const total = dasar + biayaTambahan;
    return { perOrang, dasar, biayaTambahan, rincian, total, totalPerOrang: total / pax };
  }, [p, pax, pilihTambahan]);

  const pesanWa = useMemo(() => {
    const baris = [
      `Halo ${site.nama}, saya ingin memesan perjalanan.`,
      '',
      `Paket: ${p.nama}`,
      `Jumlah peserta: ${pax} orang`,
    ];
    if (hitung.rincian.length) {
      baris.push(`Tambahan: ${hitung.rincian.map((r) => r.nama).join(', ')}`);
    }
    baris.push(
      `Perkiraan dari kalkulator: ${rupiah(hitung.total)} (${rupiah(
        Math.round(hitung.totalPerOrang)
      )} per orang)`,
      '',
      'Perkiraan tanggal: ',
      'Destinasi yang diinginkan: '
    );
    return baris.join('\n');
  }, [p, pax, hitung]);

  return (
    <div className="kartu" style={{ background: 'var(--surface-2)' }}>
      <div className="kartu-isi" style={{ padding: 26 }}>
        <h3 className="kartu-judul">Hitung perkiraan biaya</h3>
        <p className="kartu-ringkas" style={{ flex: 'none' }}>
          Angka di bawah adalah perkiraan, bukan penawaran resmi. Biaya akhir bisa berbeda
          tergantung destinasi, jarak, dan tanggal keberangkatan.
        </p>

        <div style={{ display: 'grid', gap: 18, marginTop: 8 }}>
          <div>
            <label htmlFor="pilih-paket">Paket</label>
            <select
              id="pilih-paket"
              value={idPaket}
              onChange={(e) => gantiPaket(e.target.value)}
            >
              {paket.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nama} — {x.durasi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jumlah-pax">
              Jumlah peserta ({p.minPax}
              {p.maxPax !== p.minPax ? `–${p.maxPax}` : ''} orang)
            </label>
            <input
              id="jumlah-pax"
              type="number"
              min={p.minPax}
              max={p.maxPax}
              value={pax}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isNaN(n)) return;
                setPax(Math.min(Math.max(n, p.minPax), p.maxPax));
              }}
            />
          </div>

          <div>
            <label>Tambahan opsional</label>
            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              {tambahan.map((t) => {
                const dipilih = pilihTambahan.includes(t.id);
                return (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      gap: 11,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      fontWeight: 400,
                      color: 'var(--teks-lembut)',
                      fontSize: '0.9rem',
                      marginBottom: 0,
                      padding: '10px 12px',
                      border: `1px solid ${dipilih ? 'var(--emas)' : 'var(--garis)'}`,
                      borderRadius: 'var(--radius-kecil)',
                      background: dipilih ? 'rgba(201,162,39,0.07)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={dipilih}
                      onChange={() =>
                        setPilihTambahan((arr) =>
                          arr.includes(t.id) ? arr.filter((x) => x !== t.id) : [...arr, t.id]
                        )
                      }
                      style={{ width: 'auto', marginTop: 4, accentColor: '#c9a227' }}
                    />
                    <span>
                      <strong style={{ color: 'var(--teks)' }}>{t.nama}</strong>
                      {' — '}
                      {rupiah(t.harga)} {t.satuan}
                      <br />
                      <span style={{ fontSize: '0.83rem', color: 'var(--teks-redup)' }}>{t.ket}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Hasil ---- */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--garis-terang)',
            display: 'grid',
            gap: 9,
          }}
        >
          <Baris
            kiri={`Paket ${p.nama} — ${rupiah(hitung.perOrang)} × ${pax} orang`}
            kanan={rupiah(hitung.dasar)}
          />
          {hitung.rincian.map((r) => (
            <Baris
              key={r.nama}
              kiri={`${r.nama}${r.kali > 1 ? ` × ${r.kali}` : ''}`}
              kanan={rupiah(r.jumlah)}
            />
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 14,
              marginTop: 10,
              paddingTop: 14,
              borderTop: '1px solid var(--garis-terang)',
            }}
          >
            <span style={{ fontWeight: 600 }}>Perkiraan total</span>
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.7rem',
                color: 'var(--emas-terang)',
              }}
            >
              {rupiah(hitung.total)}
            </span>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--teks-redup)', fontSize: '0.87rem' }}>
            setara {rupiah(Math.round(hitung.totalPerOrang))} per orang
          </div>
        </div>

        <a
          className="tombol tombol-wa"
          href={waLink(pesanWa)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: '100%', marginTop: 20 }}
        >
          Kirim hitungan ini ke WhatsApp
        </a>
        <p style={{ fontSize: '0.82rem', color: 'var(--teks-redup)', marginTop: 12, marginBottom: 0 }}>
          Rincian di atas otomatis ikut terkirim, jadi Anda tidak perlu mengetik ulang.
        </p>
      </div>
    </div>
  );
}

function Baris({ kiri, kanan }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 14,
        fontSize: '0.9rem',
        color: 'var(--teks-lembut)',
      }}
    >
      <span>{kiri}</span>
      <span style={{ whiteSpace: 'nowrap' }}>{kanan}</span>
    </div>
  );
}
