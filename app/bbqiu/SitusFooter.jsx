import Link from 'next/link';
import { BRAND, waLink } from '../../lib/situs';

export default function SitusFooter() {
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-footer-grid">
          <div>
            <div className="s-logo" style={{ marginBottom: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bbqiu-logo.png" alt="BBQIU" />
            </div>
            <p className="s-p" style={{ maxWidth: 340 }}>{BRAND.deskripsi}</p>
            <a
              className="s-btn s-btn-primary s-btn-sm"
              style={{ marginTop: 18 }}
              href={waLink(`Halo ${BRAND.nama}, saya mau reservasi meja.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reservasi via WhatsApp
            </a>
          </div>

          <div>
            <h4>Jelajahi</h4>
            <ul>
              <li><Link href="/bbqiu/tentang">Tentang BBQIU</Link></li>
              <li><Link href="/bbqiu/menu">Menu lengkap</Link></li>
              <li><Link href="/bbqiu/produk">Produk unggulan</Link></li>
              <li><Link href="/bbqiu/kemitraan">Peluang kerjasama</Link></li>
              <li><Link href="/bbqiu/kontak">Kontak & lokasi</Link></li>
            </ul>
          </div>

          <div>
            <h4>Kunjungi</h4>
            <ul>
              <li>{BRAND.alamat}</li>
              <li>{BRAND.jam}</li>
              <li><a href={waLink('Halo BBQIU')} target="_blank" rel="noopener noreferrer">WhatsApp: +{BRAND.wa}</a></li>
              <li><a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer">Instagram: @{BRAND.instagram}</a></li>
              <li><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></li>
            </ul>
          </div>
        </div>

        <div className="s-footer-btm">
          <div>© {new Date().getFullYear()} {BRAND.nama}. Semua harga sudah termasuk pajak restoran.</div>
          <div>Harga dan ketersediaan menu dapat berubah sewaktu-waktu.</div>
        </div>
      </div>
    </footer>
  );
}
