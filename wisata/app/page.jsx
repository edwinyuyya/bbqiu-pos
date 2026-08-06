import Link from 'next/link';
import Motif from './components/Motif';
import { site, waLink, rupiah } from '@/data/site';
import { destinasi, labelKategori } from '@/data/destinasi';
import { paket, rentangHarga } from '@/data/paket';

export default function Beranda() {
  const unggulan = destinasi.slice(0, 6);
  const paketSorot = paket.filter((p) =>
    ['private-berdua', 'rombongan', 'open-trip'].includes(p.id)
  );

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="bagian" style={{ paddingTop: 'clamp(56px, 9vw, 110px)' }}>
        <div className="bungkus">
          <span className="kop">{site.kota} &amp; Jawa Tengah</span>
          <h1 style={{ maxWidth: '16ch' }}>{site.tagline}</h1>
          <p className="utama" style={{ fontSize: '1.14rem' }}>
            Kami mengantar Anda ke tempat-tempat keramat di tanah Jawa — untuk berziarah,
            menjalankan laku, atau sekadar memahami warisan leluhur. Dengan juru kunci resmi,
            harga yang terbuka sejak awal, dan satu hal yang tidak akan pernah kami jual:
            janji bahwa hajat Anda pasti terkabul.
          </p>

          <div className="tumpuk jarak-atas">
            <Link className="tombol tombol-utama" href="/paket">
              Lihat Paket &amp; Harga
            </Link>
            <Link className="tombol tombol-garis" href="/destinasi">
              Jelajahi Destinasi
            </Link>
          </div>

          {/* Jawaban langsung atas tiga pertanyaan yang paling sering masuk */}
          <div className="kisi kisi-3 jarak-atas-besar">
            {[
              {
                t: 'Berdua saja, bisa?',
                j: 'Bisa. Ada paket private khusus untuk dua orang, tidak digabung siapa pun.',
              },
              {
                t: 'Serombongan keluarga?',
                j: 'Bisa. Tiga sampai sepuluh orang, kendaraan menyesuaikan, harga per kepala makin turun.',
              },
              {
                t: 'Ada open trip?',
                j: 'Ada. Kuota 12–15 orang, berangkat dua kali sebulan, mulai Rp 385.000 per orang.',
              },
            ].map((k) => (
              <div key={k.t} className="kartu">
                <div className="kartu-isi">
                  <h3 className="kartu-judul" style={{ fontSize: '1.1rem' }}>
                    {k.t}
                  </h3>
                  <p className="kartu-ringkas" style={{ marginBottom: 0 }}>
                    {k.j}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Paket ---- */}
      <section className="bagian bagian-alt">
        <div className="bungkus">
          <span className="kop">Pilih yang sesuai</span>
          <h2>Tiga cara berangkat</h2>
          <p className="utama">
            Sendiri, berdua, serombongan, atau bergabung dengan peserta lain. Harga per orang
            terbuka, dan menurun seiring bertambahnya peserta.
          </p>

          <div className="kisi kisi-3 jarak-atas">
            {paketSorot.map((p) => {
              const r = rentangHarga(p);
              return (
                <div key={p.id} className="kartu">
                  <div className="kartu-isi">
                    {p.sorot && (
                      <span className="pil pil-emas" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
                        {p.sorot}
                      </span>
                    )}
                    <h3 className="kartu-judul">{p.nama}</h3>
                    <p className="kartu-ringkas">{p.untukSiapa}</p>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--teks-redup)' }}>
                        {r.sama ? 'Per orang' : 'Per orang mulai dari'}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--serif)',
                          fontSize: '1.75rem',
                          color: 'var(--emas-terang)',
                        }}
                      >
                        {rupiah(r.min)}
                      </div>
                    </div>
                    <div className="kartu-kaki">
                      <span>{p.durasi}</span>
                      <Link href={`/paket#${p.id}`}>Rincian &rarr;</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tumpuk jarak-atas">
            <Link className="tombol tombol-garis" href="/paket">
              Lihat semua paket &amp; hitung sendiri
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Destinasi ---- */}
      <section className="bagian">
        <div className="bungkus">
          <span className="kop">Tujuan perjalanan</span>
          <h2>Tempat yang kami dampingi</h2>
          <p className="utama">
            Setiap lokasi punya sejarah, adab, dan laku yang berbeda. Kami tuliskan apa adanya —
            termasuk yang berat dan yang sebaiknya Anda hindari.
          </p>

          <div className="kisi kisi-3 jarak-atas">
            {unggulan.map((d, i) => (
              <Link
                key={d.slug}
                href={`/destinasi/${d.slug}`}
                className="kartu"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <Motif warna={d.warna} seed={i} tinggi={150} label={d.kabupaten} />
                <div className="kartu-isi">
                  <h3 className="kartu-judul">{d.nama}</h3>
                  <div className="kartu-lokasi">{d.lokasi}</div>
                  <p className="kartu-ringkas">{d.ringkas}</p>
                  <div className="kartu-kaki">
                    <span>{d.kategori.map((k) => labelKategori[k]).join(' · ')}</span>
                    <span className="pil">{d.tingkat}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="tumpuk jarak-atas">
            <Link className="tombol tombol-garis" href="/destinasi">
              Semua destinasi
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Janji ---- */}
      <section className="bagian bagian-alt">
        <div className="bungkus">
          <span className="kop">Kenapa lewat kami</span>
          <h2 style={{ maxWidth: '20ch' }}>Terlalu banyak orang ditipu saat sedang paling rapuh</h2>
          <p className="utama">
            Usaha ini berdiri karena kami sering mendengar cerita yang sama: orang datang dalam
            keadaan sulit, lalu dimintai uang berkali-kali oleh orang yang mengaku punya akses
            khusus. Empat hal berikut adalah cara kami memastikan itu tidak terjadi pada Anda.
          </p>

          <div className="kisi kisi-2 jarak-atas">
            {site.janji.map((j, i) => (
              <div key={j.judul} className="kartu">
                <div className="kartu-isi">
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '1.5rem',
                      color: 'var(--emas)',
                      marginBottom: 8,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="kartu-judul" style={{ fontSize: '1.12rem' }}>
                    {j.judul}
                  </h3>
                  <p className="kartu-ringkas" style={{ marginBottom: 0 }}>
                    {j.isi}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="tumpuk jarak-atas">
            <Link className="tombol tombol-garis" href="/etika">
              Baca janji lengkap &amp; apa yang kami tolak
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Ajakan ---- */}
      <section className="bagian">
        <div className="bungkus tengah rapat" style={{ marginInline: 'auto' }}>
          <h2>Ceritakan dulu rencana Anda</h2>
          <p className="utama">
            Mengobrol dengan kami tidak dipungut biaya, dan tidak ada kewajiban memesan. Kalau
            menurut kami perjalanan ini belum tepat untuk situasi Anda sekarang, kami akan
            mengatakannya terus terang.
          </p>
          <div className="tumpuk tumpuk-tengah jarak-atas">
            <a
              className="tombol tombol-wa"
              href={waLink(
                `Halo ${site.nama}, saya ingin bertanya soal perjalanan. Rencana saya: `
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mulai obrolan di WhatsApp
            </a>
            <Link className="tombol tombol-garis" href="/cara-kerja">
              Lihat alurnya dulu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
