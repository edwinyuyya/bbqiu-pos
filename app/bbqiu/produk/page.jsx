import Link from 'next/link';
import { BRAND, MENU, PAKET, UNGGULAN, rupiah, waLink } from '../../../lib/situs';

export const metadata = {
  title: 'Produk Unggulan',
  description:
    'Produk unggulan BBQIU: empat kelas sate, daging premium grill, Grill & Suki dua cara makan, steamboat, dan Paket Value Set.',
};

const LINI = [
  {
    slug: 'sate',
    ikon: '🍢',
    nama: 'Lini Sate — empat kelas harga',
    ringkas:
      'Inti dari BBQIU. Empat tingkat harga dalam satu meja, jadi tidak ada tamu yang merasa salah tempat.',
    detail: [
      ['Sate 3.900', 'Sayur, tahu, dan jeroan. Pintu masuk termurah, paling sering dipesan sepuluh tusuk sekaligus.'],
      ['Sate 6.900', 'Ayam, bakso, dan jamur. Kelas paling laris dan paling aman untuk pengunjung baru.'],
      ['Sate Spesial 9.900', 'Kikil, paru, otot sapi, cumi — bagian yang sulit ditemukan di panggangan lain.'],
      ['Sate Premium 14.900', 'Saikoro, sirloin, beef bacon, udang jumbo. Rasa premium dalam ukuran tusukan.'],
    ],
  },
  {
    slug: 'daging',
    ikon: '🥩',
    nama: 'Daging Premium (Grill)',
    ringkas:
      'Potongan utuh dalam porsi small, supaya satu meja bisa mencoba banyak jenis daging dalam satu kunjungan.',
    detail: [
      ['US Karubi Small', 'Short rib khas Jepang, berlemak tipis dan cepat matang di bara.'],
      ['Saikoro & Chuck Crest', 'Potongan dadu yang tetap juicy walau dibakar sendiri oleh tamu.'],
      ['Sirloin & Tenderloin Small', 'Dua pilihan klasik untuk yang ingin daging tanpa banyak lemak.'],
      ['Tendon & Lidah', 'Tekstur kenyal yang jadi favorit pelanggan lama.'],
    ],
  },
  {
    slug: 'grill-suki',
    ikon: '🍤',
    nama: 'Grill & Suki — satu item, dua cara makan',
    ringkas:
      'Seluruh lini ini boleh dibakar atau dicelup ke kuah suki. Tamu memilih saat memesan.',
    detail: [
      ['Seafood', 'Udang, fillet salmon, tuna, dory, bakso kakap, salmon ball.'],
      ['Olahan', 'Beef patty, smoked beef, siomay bikinan sendiri, otak-otak Singapore, chikuwa.'],
      ['Sayur & jamur', 'Enoki, hioko, jagung manis, onion grill.'],
    ],
  },
  {
    slug: 'suki',
    ikon: '🍲',
    nama: 'Suki / Steamboat',
    ringkas:
      'Kuah panas di sisi meja. Menyeimbangkan bakaran dan membuat tamu bertahan lebih lama.',
    detail: [
      ['Sayur segar', 'Brokoli, sawi sendok, sawi putih.'],
      ['Tahu & jamur', 'Tofu, tahu sutra, jamur kuping, jamur salju.'],
    ],
  },
  {
    slug: 'nasi',
    ikon: '🍚',
    nama: 'Nasi & Snack',
    ringkas:
      'Pendamping wajib untuk rombongan keluarga dan tamu yang datang dengan anak.',
    detail: [
      ['Nasi goreng', 'Bawang, soy sauce, dan egg fried rice untuk berbagi.'],
      ['French fries', 'Termasuk porsi sharing besar untuk meja rombongan.'],
    ],
  },
];

export default function ProdukPage() {
  return (
    <main>
      <section className="s-hero" style={{ padding: '72px 0 40px' }}>
        <div className="s-wrap" style={{ position: 'relative', maxWidth: 800 }}>
          <span className="s-eyebrow">Produk unggulan</span>
          <h1 className="s-h1" style={{ marginTop: 14 }}>
            Lima lini produk,<br />
            <span className="s-api-ember">satu panggangan.</span>
          </h1>
          <p className="s-lead" style={{ marginTop: 20 }}>
            Menu BBQIU disusun berlapis: tusukan murah untuk membuka meja, daging
            premium untuk membuat kunjungan terasa istimewa, dan suki untuk
            menahan tamu tetap duduk. Susunan inilah yang membuat rata-rata
            belanja per meja naik tanpa harus menaikkan harga.
          </p>
        </div>
      </section>

      {/* Sorotan */}
      <section className="s-sec-tight">
        <div className="s-wrap">
          <div className="s-grid s-g3">
            {UNGGULAN.map((u) => (
              <article key={u.nama} className="s-card s-card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 30 }}>{u.ikon}</span>
                  <span className="s-chip">{rupiah(u.harga)}</span>
                </div>
                <h2 className="s-h3" style={{ marginTop: 14 }}>{u.nama}</h2>
                <p className="s-p" style={{ marginTop: 9, fontSize: 15 }}>{u.kenapa}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Lini produk */}
      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap" style={{ display: 'grid', gap: 18 }}>
          <div style={{ maxWidth: 700 }}>
            <span className="s-eyebrow">Lini lengkap</span>
            <h2 className="s-h2" style={{ marginTop: 12 }}>Apa saja yang keluar dari dapur kami</h2>
          </div>

          {LINI.map((l) => {
            const kat = MENU.filter((k) =>
              l.slug === 'sate' ? k.slug.startsWith('sate') : k.slug === l.slug || (l.slug === 'daging' && k.slug === 'daging-premium') || (l.slug === 'nasi' && k.slug === 'nasi-snack'),
            );
            const jumlah = kat.reduce((n, k) => n + k.items.length, 0);
            return (
              <article key={l.slug} className="s-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,0.85fr) 1.15fr', gap: 28 }}>
                <div>
                  <div style={{ fontSize: 34 }}>{l.ikon}</div>
                  <h3 className="s-h3" style={{ marginTop: 12, fontSize: 22 }}>{l.nama}</h3>
                  <p className="s-p" style={{ marginTop: 10 }}>{l.ringkas}</p>
                  {jumlah > 0 && (
                    <div className="s-chip" style={{ marginTop: 14 }}>{jumlah} item di menu</div>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                  {l.detail.map(([judul, isi]) => (
                    <div key={judul} style={{ padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid var(--s-line)' }}>
                      <div style={{ fontWeight: 800, fontSize: 15.5 }}>{judul}</div>
                      <p className="s-p" style={{ marginTop: 5, fontSize: 14.5 }}>{isi}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Paket */}
      <section className="s-sec">
        <div className="s-wrap">
          <div className="s-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 30, alignItems: 'center', background: 'linear-gradient(180deg, rgba(255,176,32,.1), rgba(255,255,255,.03))', borderColor: 'rgba(255,176,32,.4)' }}>
            <div>
              <span className="s-chip">Produk paket</span>
              <h2 className="s-h2" style={{ marginTop: 14, fontSize: 34 }}>{PAKET.nama}</h2>
              <div className="s-stat-num" style={{ marginTop: 8 }}>{rupiah(PAKET.harga)}</div>
              <p className="s-p" style={{ marginTop: 12, maxWidth: 420 }}>{PAKET.ringkas}</p>
              <a className="s-btn s-btn-primary" style={{ marginTop: 20 }} href={waLink(`Halo ${BRAND.nama}, saya mau pesan ${PAKET.nama}.`)} target="_blank" rel="noopener noreferrer">
                Pesan paket ini
              </a>
            </div>
            <ul className="s-list">
              {PAKET.isi.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="s-sec-tight" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap" style={{ textAlign: 'center' }}>
          <h2 className="s-h2">Mau menjual produk ini di kota Anda?</h2>
          <p className="s-lead" style={{ marginTop: 14, maxWidth: 560, marginInline: 'auto' }}>
            Resep, rantai pasok, dan sistem operasionalnya sudah jadi. Yang kami
            cari adalah mitra yang mau turun ke outlet.
          </p>
          <div className="s-btns" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link className="s-btn s-btn-primary" href="/bbqiu/kemitraan">Lihat peluang kerjasama</Link>
            <Link className="s-btn s-btn-ghost" href="/bbqiu/menu">Menu &amp; harga lengkap</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
