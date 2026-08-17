import Link from 'next/link';
import MenuSitus from './MenuSitus';
import { BRAND, MENU, PAKET, rupiah, waLink } from '../../../lib/situs';

export const metadata = {
  title: 'Menu & Harga',
  description:
    'Daftar lengkap menu BBQIU: empat kelas sate mulai 3.900, daging premium grill, Grill & Suki, steamboat, nasi dan snack. Harga tertulis, tanpa biaya tersembunyi.',
};

export default function MenuPage() {
  const total = MENU.reduce((n, k) => n + k.items.length, 0);
  const termurah = Math.min(...MENU.flatMap((k) => k.items.map(([, h]) => h)));

  return (
    <main>
      <section className="s-hero" style={{ padding: '72px 0 36px' }}>
        <div className="s-wrap" style={{ position: 'relative' }}>
          <span className="s-eyebrow">Menu &amp; harga</span>
          <h1 className="s-h1" style={{ marginTop: 14, maxWidth: 760 }}>
            {total} item siap bakar,<br />
            <span className="s-api-ember">mulai {rupiah(termurah)}.</span>
          </h1>
          <p className="s-lead" style={{ marginTop: 20, maxWidth: 620 }}>
            Semua dipesan satuan. Campur bebas antara sate, daging premium, dan
            isian suki — satu meja bisa berisi tusukan 3.900 dan karubi 22.900
            sekaligus. Harga di bawah sudah termasuk pajak restoran.
          </p>

          <div className="s-card" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, alignItems: 'center' }}>
            <div>
              <span className="s-chip">Paling gampang untuk pertama kali</span>
              <h2 className="s-h3" style={{ marginTop: 12, fontSize: 24 }}>{PAKET.nama} · {rupiah(PAKET.harga)}</h2>
              <p className="s-p" style={{ marginTop: 8 }}>{PAKET.ringkas}</p>
            </div>
            <ul className="s-list">
              {PAKET.isi.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <MenuSitus />

      <section className="s-sec-tight" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap s-grid s-g3">
          {[
            ['🔥', 'Cara masak bisa dipilih', 'Item Grill & Suki boleh dibakar di panggangan atau dicelup ke kuah. Sebutkan saat memesan.'],
            ['🧾', 'Tanpa biaya tambahan', 'Tidak ada biaya panggangan atau arang. Yang tertulis di menu itulah yang masuk ke struk.'],
            ['📱', 'Pesan dari meja', 'Scan QR di meja untuk memanggil waiter dan memantau pesanan yang sudah masuk.'],
          ].map(([ikon, judul, isi]) => (
            <div key={judul} className="s-card">
              <div style={{ fontSize: 26 }}>{ikon}</div>
              <h3 className="s-h3" style={{ marginTop: 12, fontSize: 17 }}>{judul}</h3>
              <p className="s-p" style={{ marginTop: 8, fontSize: 14.5 }}>{isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap" style={{ textAlign: 'center' }}>
          <h2 className="s-h2">Sudah tahu mau pesan apa?</h2>
          <p className="s-lead" style={{ marginTop: 14, maxWidth: 520, marginInline: 'auto' }}>
            Sebutkan jumlah orang dan jam kedatangan, biar mejanya kami siapkan
            beserta baranya.
          </p>
          <div className="s-btns" style={{ justifyContent: 'center', marginTop: 24 }}>
            <a className="s-btn s-btn-primary" href={waLink(`Halo ${BRAND.nama}, saya mau reservasi meja.`)} target="_blank" rel="noopener noreferrer">
              Reservasi via WhatsApp
            </a>
            <Link className="s-btn s-btn-ghost" href="/bbqiu/produk">Lihat produk unggulan</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
