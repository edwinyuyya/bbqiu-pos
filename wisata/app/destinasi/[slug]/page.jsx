import Link from 'next/link';
import { notFound } from 'next/navigation';
import Motif from '../../components/Motif';
import { destinasi, cariDestinasi, labelKategori } from '@/data/destinasi';
import { site, waLink } from '@/data/site';

export function generateStaticParams() {
  return destinasi.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = cariDestinasi(slug);
  if (!d) return { title: 'Destinasi tidak ditemukan' };
  return {
    title: d.nama,
    description: d.ringkas,
    openGraph: { title: `${d.nama} · ${site.nama}`, description: d.ringkas },
  };
}

export default async function HalamanDetail({ params }) {
  const { slug } = await params;
  const d = cariDestinasi(slug);
  if (!d) notFound();

  const urut = destinasi.findIndex((x) => x.slug === slug);
  const lainnya = destinasi.filter((x) => x.slug !== slug).slice(0, 3);
  const punyaFoto = Array.isArray(d.foto) && d.foto.length > 0;

  const pesan =
    `Halo ${site.nama}, saya tertarik dengan perjalanan ke ${d.nama} (${d.kabupaten}). ` +
    `Rencana peserta: ... orang. Perkiraan tanggal: ...`;

  return (
    <>
      {/* ---- Kepala ---- */}
      <div style={{ position: 'relative' }}>
        {punyaFoto ? (
          <div style={{ height: 'clamp(240px, 38vw, 420px)', overflow: 'hidden' }}>
            <img
              src={d.foto[0]}
              alt={d.nama}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <Motif warna={d.warna} seed={urut} tinggi={320} />
        )}
      </div>

      <section className="bagian" style={{ paddingTop: 40 }}>
        <div className="bungkus">
          <Link href="/destinasi" style={{ fontSize: '0.88rem' }}>
            &larr; Semua destinasi
          </Link>

          <div style={{ marginTop: 18 }}>
            <div className="tumpuk" style={{ marginBottom: 14 }}>
              {d.kategori.map((k) => (
                <span key={k} className="pil pil-emas">
                  {labelKategori[k]}
                </span>
              ))}
              <span className="pil">Tingkat: {d.tingkat}</span>
            </div>

            <h1 style={{ marginBottom: 6 }}>{d.nama}</h1>
            <p style={{ color: 'var(--teks-redup)', fontSize: '0.98rem' }}>
              {d.lokasi} — {d.kabupaten}
            </p>
          </div>

          {d.catatan && (
            <div className="catatan" style={{ margin: '26px 0' }}>
              <strong>Catatan penting.</strong> {d.catatan}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.9fr) minmax(0, 1fr)',
              gap: 42,
              marginTop: 34,
              alignItems: 'start',
            }}
            className="tata-detail"
          >
            {/* ---- Kolom utama ---- */}
            <div>
              <h2 style={{ fontSize: '1.5rem' }}>Riwayat tempat ini</h2>
              <p style={{ color: 'var(--teks-lembut)' }}>{d.sejarah}</p>

              {d.video && (
                <div style={{ margin: '30px 0' }}>
                  <div
                    style={{
                      position: 'relative',
                      paddingBottom: '56.25%',
                      height: 0,
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      border: '1px solid var(--garis)',
                    }}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${d.video}`}
                      title={`Video ${d.nama}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    />
                  </div>
                </div>
              )}

              <h2 style={{ fontSize: '1.5rem', marginTop: 38 }}>Alasan orang datang ke sini</h2>
              <ul className="daftar-centang">
                {d.tujuanUmum.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              <h2 style={{ fontSize: '1.5rem', marginTop: 38 }}>Laku yang lazim dijalankan</h2>
              <ul className="daftar-centang">
                {d.laku.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              <h2 style={{ fontSize: '1.5rem', marginTop: 38 }}>Uborampe yang diperlukan</h2>
              <ul className="daftar-centang">
                {d.uborampe.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p style={{ color: 'var(--teks-redup)', fontSize: '0.89rem', marginTop: 12 }}>
                Anda boleh menyiapkan sendiri. Kami menyediakannya agar peserta luar kota tidak
                kerepotan dan tidak dikenai harga turis di sekitar lokasi.
              </p>

              <h2 style={{ fontSize: '1.5rem', marginTop: 38 }}>Adab &amp; aturan di lokasi</h2>
              <div className="catatan catatan-emas">
                <ul className="daftar-centang" style={{ gap: 11 }}>
                  {d.adab.map((t) => (
                    <li key={t} style={{ color: 'var(--teks-lembut)' }}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {punyaFoto && d.foto.length > 1 && (
                <>
                  <h2 style={{ fontSize: '1.5rem', marginTop: 38 }}>Dokumentasi</h2>
                  <div className="kisi kisi-3">
                    {d.foto.slice(1).map((f) => (
                      <img
                        key={f}
                        src={f}
                        alt={d.nama}
                        style={{
                          borderRadius: 'var(--radius-kecil)',
                          border: '1px solid var(--garis)',
                          width: '100%',
                          height: 180,
                          objectFit: 'cover',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ---- Kolom samping ---- */}
            <aside style={{ position: 'sticky', top: 92 }}>
              <div className="kartu">
                <div className="kartu-isi">
                  <h3 className="kartu-judul" style={{ fontSize: '1.05rem' }}>
                    Ringkasan
                  </h3>
                  <dl style={{ margin: 0, display: 'grid', gap: 14 }}>
                    <Fakta label="Lama perjalanan" isi={d.durasi} />
                    <Fakta label="Tingkat kesulitan" isi={d.tingkat} />
                    <Fakta label="Waktu terbaik" isi={d.waktuTerbaik} />
                    <Fakta label="Akses juru kunci" isi={d.jurukunci} />
                  </dl>
                </div>
              </div>

              <div className="kartu" style={{ marginTop: 18 }}>
                <div className="kartu-isi">
                  <h3 className="kartu-judul" style={{ fontSize: '1.05rem' }}>
                    Tertarik ke sini?
                  </h3>
                  <p className="kartu-ringkas">
                    Kirimkan jumlah peserta dan perkiraan tanggal Anda. Kami balas dengan rincian
                    biaya lengkap, tanpa biaya tersembunyi.
                  </p>
                  <a
                    className="tombol tombol-wa"
                    href={waLink(pesan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ width: '100%' }}
                  >
                    Tanyakan lokasi ini
                  </a>
                  <Link
                    className="tombol tombol-garis"
                    href="/paket"
                    style={{ width: '100%', marginTop: 10 }}
                  >
                    Hitung perkiraan harga
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* ---- Destinasi lain ---- */}
          <div className="jarak-atas-besar">
            <h2 style={{ fontSize: '1.5rem' }}>Sering dirangkai bersama</h2>
            <div className="kisi kisi-3 jarak-atas">
              {lainnya.map((x) => (
                <Link
                  key={x.slug}
                  href={`/destinasi/${x.slug}`}
                  className="kartu"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Motif
                    warna={x.warna}
                    seed={destinasi.indexOf(x)}
                    tinggi={120}
                    label={x.kabupaten}
                  />
                  <div className="kartu-isi">
                    <h3 className="kartu-judul" style={{ fontSize: '1.08rem' }}>
                      {x.nama}
                    </h3>
                    <p className="kartu-ringkas" style={{ marginBottom: 0 }}>
                      {x.ringkas}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Fakta({ label, isi }) {
  return (
    <div>
      <dt
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--emas)',
          marginBottom: 4,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, fontSize: '0.9rem', color: 'var(--teks-lembut)' }}>{isi}</dd>
    </div>
  );
}
