import Link from 'next/link';
import Kalkulator from './Kalkulator';
import { paket, tambahan } from '@/data/paket';
import { site, waLink, rupiah } from '@/data/site';

export const metadata = {
  title: 'Paket & Harga',
  description:
    'Harga per orang untuk perjalanan private berdua, rombongan keluarga, open trip gabungan, laku tirakat bermalam, dan ziarah wali. Terbuka, lengkap dengan kalkulator.',
};

export default function HalamanPaket() {
  return (
    <>
      <section className="bagian" style={{ paddingBottom: 30 }}>
        <div className="bungkus">
          <span className="kop">Terbuka sejak awal</span>
          <h1>Paket &amp; Harga</h1>
          <p className="utama">
            Kami menaruh seluruh harga di halaman ini supaya Anda bisa menghitung sendiri sebelum
            menghubungi kami. Tidak ada nomor yang harus Anda kejar dulu untuk sekadar tahu
            kisarannya.
          </p>

          <div className="catatan catatan-emas jarak-atas" style={{ maxWidth: '70ch' }}>
            <strong>Harga per orang menurun seiring bertambahnya peserta.</strong> Biaya terbesar
            adalah kendaraan, pengemudi, dan pendamping — dan itu dibagi rata. Karena itu open trip
            jauh lebih murah daripada private, bukan karena layanannya lebih rendah.
          </div>
        </div>
      </section>

      {/* ---- Daftar paket ---- */}
      <section className="bagian" style={{ paddingTop: 20 }}>
        <div className="bungkus">
          <div style={{ display: 'grid', gap: 24 }}>
            {paket.map((p) => (
              <article key={p.id} id={p.id} className="kartu" style={{ scrollMarginTop: 90 }}>
                <div className="kartu-isi" style={{ padding: 28 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 14,
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ flex: '1 1 320px' }}>
                      {p.sorot && (
                        <span className="pil pil-emas" style={{ marginBottom: 10, display: 'inline-block' }}>
                          {p.sorot}
                        </span>
                      )}
                      <h2 style={{ fontSize: '1.7rem', marginBottom: 6 }}>{p.nama}</h2>
                      <p style={{ color: 'var(--teks-lembut)', marginBottom: 10 }}>{p.untukSiapa}</p>
                      <p
                        style={{
                          color: 'var(--emas-terang)',
                          fontFamily: 'var(--serif)',
                          fontSize: '1.05rem',
                          marginBottom: 0,
                        }}
                      >
                        {p.jawabanSingkat}
                      </p>
                    </div>

                    <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: 190 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--teks-redup)' }}>
                        {p.durasi}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--teks-redup)', marginBottom: 8 }}>
                        {p.destinasiMax}
                      </div>
                    </div>
                  </div>

                  {/* Tabel tarif */}
                  <div className="tabel-gulir" style={{ marginBottom: 22 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Jumlah peserta</th>
                          <th>Harga per orang</th>
                          <th>Total rombongan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.tarif.map((t) => (
                          <tr key={`${t.min}-${t.max}`}>
                            <td>
                              {t.min === t.max ? `${t.min} orang` : `${t.min}–${t.max} orang`}
                            </td>
                            <td style={{ color: 'var(--emas-terang)', fontWeight: 600 }}>
                              {rupiah(t.harga)}
                            </td>
                            <td>
                              {t.min === t.max
                                ? rupiah(t.harga * t.min)
                                : `${rupiah(t.harga * t.min)} – ${rupiah(t.harga * t.max)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="kisi kisi-2">
                    <div>
                      <h3 style={{ fontSize: '1rem', fontFamily: 'var(--sans)', color: 'var(--emas)' }}>
                        Sudah termasuk
                      </h3>
                      <ul className="daftar-centang">
                        {p.termasuk.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontFamily: 'var(--sans)',
                          color: 'var(--teks-redup)',
                        }}
                      >
                        Belum termasuk
                      </h3>
                      <ul className="daftar-centang daftar-silang">
                        {p.tidakTermasuk.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {p.catatan && (
                    <div className="catatan" style={{ marginTop: 22 }}>
                      {p.catatan}
                    </div>
                  )}

                  <div className="tumpuk" style={{ marginTop: 24 }}>
                    <a
                      className="tombol tombol-wa"
                      href={waLink(
                        `Halo ${site.nama}, saya tertarik dengan paket ${p.nama}. ` +
                          `Jumlah peserta: ... orang. Perkiraan tanggal: ...`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tanyakan paket ini
                    </a>
                    <Link className="tombol tombol-garis" href="#kalkulator">
                      Hitung dengan tambahan
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Tambahan & kalkulator ---- */}
      <section className="bagian bagian-alt" id="kalkulator" style={{ scrollMarginTop: 70 }}>
        <div className="bungkus">
          <span className="kop">Hitung sendiri</span>
          <h2>Kalkulator biaya</h2>
          <p className="utama">
            Pilih paket, isi jumlah peserta, centang tambahan yang Anda perlukan. Hasilnya bisa
            langsung dikirim ke WhatsApp kami tanpa perlu diketik ulang.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 32,
              marginTop: 30,
              alignItems: 'start',
            }}
            className="tata-detail"
          >
            <Kalkulator />

            <div>
              <h3>Daftar tambahan</h3>
              <div className="tabel-gulir">
                <table>
                  <thead>
                    <tr>
                      <th>Tambahan</th>
                      <th>Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tambahan.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <strong style={{ color: 'var(--teks)' }}>{t.nama}</strong>
                          <br />
                          <span style={{ fontSize: '0.85rem', color: 'var(--teks-redup)' }}>
                            {t.ket}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {rupiah(t.harga)}
                          <br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--teks-redup)' }}>
                            {t.satuan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="catatan jarak-atas">
                <strong>Cara membayar.</strong> Uang muka 30 persen untuk mengunci tanggal, sisanya
                paling lambat 3 hari sebelum berangkat. Transfer ke rekening atas nama badan usaha,
                bukan rekening pribadi. Kuitansi resmi kami kirim setiap kali Anda membayar.{' '}
                <Link href="/faq">Lihat aturan pembatalan &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
