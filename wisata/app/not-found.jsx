import Link from 'next/link';

export const metadata = { title: 'Halaman tidak ditemukan' };

export default function TidakDitemukan() {
  return (
    <section className="bagian">
      <div className="bungkus tengah rapat" style={{ marginInline: 'auto', paddingBlock: 60 }}>
        <span className="kop">404</span>
        <h1>Halaman ini tidak ada</h1>
        <p className="utama">
          Mungkin tautannya salah ketik, atau halamannya sudah kami pindahkan. Silakan kembali ke
          beranda atau lihat daftar destinasi.
        </p>
        <div className="tumpuk tumpuk-tengah jarak-atas">
          <Link className="tombol tombol-utama" href="/">
            Kembali ke beranda
          </Link>
          <Link className="tombol tombol-garis" href="/destinasi">
            Lihat destinasi
          </Link>
        </div>
      </div>
    </section>
  );
}
