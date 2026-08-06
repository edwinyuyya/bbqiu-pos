import Link from 'next/link';
import { site, waLink } from '@/data/site';
import { destinasi } from '@/data/destinasi';

export default function Footer() {
  const tahun = new Date().getFullYear();
  const legal = site.legalitas || {};
  const adaLegal = legal.nib || legal.badanUsaha || legal.asosiasi;

  return (
    <footer className="kaki">
      <div className="bungkus">
        <div className="kaki-kisi">
          <div>
            <h4>{site.nama}</h4>
            <p style={{ color: 'var(--teks-lembut)', fontSize: '0.94rem', maxWidth: '42ch' }}>
              {site.deskripsi}
            </p>
            <div className="tumpuk" style={{ marginTop: 18 }}>
              <a
                className="tombol tombol-wa"
                href={waLink(`Halo ${site.nama}, saya ingin bertanya soal paket perjalanan.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              {site.instagram && (
                <a
                  className="tombol tombol-garis"
                  href={`https://instagram.com/${site.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div>
            <h4>Destinasi</h4>
            <ul className="kaki-daftar">
              {destinasi.slice(0, 6).map((d) => (
                <li key={d.slug}>
                  <Link href={`/destinasi/${d.slug}`}>{d.nama}</Link>
                </li>
              ))}
              <li>
                <Link href="/destinasi">Lihat semua &rarr;</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Informasi</h4>
            <ul className="kaki-daftar">
              <li>
                <Link href="/paket">Paket &amp; Harga</Link>
              </li>
              <li>
                <Link href="/cara-kerja">Cara Kerja</Link>
              </li>
              <li>
                <Link href="/etika">Janji &amp; Etika Kami</Link>
              </li>
              <li>
                <Link href="/faq">Tanya Jawab</Link>
              </li>
              <li style={{ color: 'var(--teks-lembut)', fontSize: '0.92rem' }}>{site.kota}</li>
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {adaLegal && (
          <p style={{ marginTop: 32, fontSize: '0.84rem', color: 'var(--teks-redup)' }}>
            {[legal.badanUsaha, legal.nib && `NIB ${legal.nib}`, legal.asosiasi]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <div className="kaki-bawah">
          <span>
            &copy; {tahun} {site.nama}. Seluruh hak cipta dilindungi.
          </span>
          <span>
            Kami memfasilitasi perjalanan dan laku, bukan menjual jaminan hasil.
          </span>
        </div>
      </div>
    </footer>
  );
}
