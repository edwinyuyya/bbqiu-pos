import Link from 'next/link';
import { BRAND, waLink } from '../../../lib/situs';

export const metadata = {
  title: 'Kontak & Lokasi',
  description: `Alamat, jam buka, dan kontak ${BRAND.nama}. Reservasi meja, pesan katering, atau tanya kemitraan lewat WhatsApp.`,
};

const KANAL = [
  {
    ikon: '🍽️',
    judul: 'Reservasi meja',
    isi: 'Sebutkan jumlah orang dan jam kedatangan. Akhir pekan sebaiknya pesan sebelum sore.',
    aksi: 'Reservasi via WhatsApp',
    pesan: `Halo ${BRAND.nama}, saya mau reservasi meja untuk ... orang, jam ...`,
  },
  {
    ikon: '🎪',
    judul: 'Event & katering',
    isi: 'Panggangan BBQIU datang ke acara Anda. Minimal 30 porsi, menu bisa disesuaikan anggaran.',
    aksi: 'Tanya katering',
    pesan: `Halo ${BRAND.nama}, saya mau tanya katering/event untuk ... orang pada tanggal ...`,
  },
  {
    ikon: '🤝',
    judul: 'Kemitraan',
    isi: 'Mau buka outlet, jadi pemasok, atau kolaborasi brand? Tim kemitraan yang menjawab.',
    aksi: 'Minta proposal',
    pesan: `Halo ${BRAND.nama}, saya tertarik dengan peluang kerjasama.`,
  },
  {
    ikon: '💬',
    judul: 'Saran & keluhan',
    isi: 'Ada yang kurang pas saat berkunjung? Beri tahu kami — keluhan lebih berguna daripada bintang lima.',
    aksi: 'Kirim masukan',
    pesan: `Halo ${BRAND.nama}, saya mau menyampaikan masukan setelah berkunjung.`,
  },
];

export default function KontakPage() {
  return (
    <main>
      <section className="s-hero" style={{ padding: '76px 0 40px' }}>
        <div className="s-wrap" style={{ position: 'relative', maxWidth: 780 }}>
          <span className="s-eyebrow">Kontak</span>
          <h1 className="s-h1" style={{ marginTop: 14 }}>
            Baranya menyala<br />
            <span className="s-api-ember">{BRAND.jam.replace('Setiap hari · ', 'tiap hari ')}</span>
          </h1>
          <p className="s-lead" style={{ marginTop: 20 }}>
            Semua urusan — reservasi, katering, sampai kemitraan — dijawab lewat
            satu nomor WhatsApp yang sama. Tidak ada robot, tidak ada antrean tiket.
          </p>
          <div className="s-btns" style={{ marginTop: 24 }}>
            <a className="s-btn s-btn-primary" href={waLink(`Halo ${BRAND.nama},`)} target="_blank" rel="noopener noreferrer">
              💬 Chat +{BRAND.wa}
            </a>
            <a className="s-btn s-btn-ghost" href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer">
              Instagram @{BRAND.instagram}
            </a>
          </div>
        </div>
      </section>

      <section className="s-sec-tight">
        <div className="s-wrap s-grid s-g2">
          {KANAL.map((k) => (
            <article key={k.judul} className="s-card s-card-hover">
              <div style={{ fontSize: 28 }}>{k.ikon}</div>
              <h2 className="s-h3" style={{ marginTop: 12 }}>{k.judul}</h2>
              <p className="s-p" style={{ marginTop: 8, fontSize: 15 }}>{k.isi}</p>
              <a className="s-btn s-btn-ghost s-btn-sm" style={{ marginTop: 16 }} href={waLink(k.pesan)} target="_blank" rel="noopener noreferrer">
                {k.aksi} →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap s-grid s-g2" style={{ alignItems: 'start' }}>
          <div className="s-card">
            <span className="s-chip">Kunjungi kami</span>
            <h2 className="s-h3" style={{ marginTop: 14, fontSize: 22 }}>{BRAND.alamat}</h2>
            <ul style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              {[
                ['🕔', 'Jam buka', BRAND.jam],
                ['🅿️', 'Parkir', 'Tersedia untuk motor dan mobil di depan outlet.'],
                ['👨‍👩‍👧', 'Rombongan', 'Meja bisa digabung untuk rombongan. Kabari dulu agar disiapkan.'],
                ['💳', 'Pembayaran', 'Tunai dan QRIS. Struk bisa diminta dalam bentuk digital.'],
              ].map(([ikon, judul, isi]) => (
                <li key={judul} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 19 }}>{ikon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{judul}</div>
                    <p className="s-p" style={{ fontSize: 14.5, marginTop: 2 }}>{isi}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a
              className="s-btn s-btn-primary"
              style={{ marginTop: 20 }}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BRAND.nama} ${BRAND.alamat}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka di Google Maps
            </a>
          </div>

          <div className="s-card" style={{ display: 'grid', gap: 14 }}>
            <h2 className="s-h3" style={{ fontSize: 22 }}>Sebelum datang</h2>
            <ul className="s-list">
              <li>Jam 18.00–20.00 adalah jam tersibuk; reservasi menghemat antre.</li>
              <li>Setiap meja punya panggangan sendiri — pakai baju yang tidak keberatan kena aroma bakaran.</li>
              <li>Menu bisa dipesan satuan, tidak ada minimum pembelian per orang.</li>
              <li>Beberapa item premium terbatas per hari; tanyakan lewat WhatsApp kalau ingin memastikan.</li>
            </ul>
            <div className="s-btns">
              <Link className="s-btn s-btn-ghost s-btn-sm" href="/bbqiu/menu">Lihat menu dulu</Link>
              <Link className="s-btn s-btn-ghost s-btn-sm" href="/bbqiu/kemitraan">Peluang kerjasama</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
