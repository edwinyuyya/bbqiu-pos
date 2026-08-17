import Link from 'next/link';
import { ANGKA, BRAND, MENU, PAKET, UNGGULAN, rupiah, waLink } from '../../lib/situs';

export const metadata = {
  title: `${BRAND.nama} — ${BRAND.tagline}`,
  description: BRAND.deskripsi,
};

const ALASAN = [
  {
    ikon: '🔥',
    judul: 'Panggangan di setiap meja',
    isi: 'Bukan dapur yang membakar untuk Anda. Bara ada di meja Anda sendiri, jadi setiap tusuk matang persis seperti yang Anda mau — dan makan malam berubah jadi kegiatan bersama.',
  },
  {
    ikon: '🏷️',
    judul: 'Harga per tusuk, bukan paket',
    isi: 'Mulai 3.900. Datang berdua dengan 60 ribu atau berenam dengan 400 ribu, dua-duanya masuk akal. Anda yang menentukan besarnya, bukan daftar paket.',
  },
  {
    ikon: '🥩',
    judul: 'Daging premium porsi kecil',
    isi: 'Saikoro, karubi, sirloin, dan lidah tersedia dalam porsi small. Satu meja bisa mencicipi lima jenis daging dalam satu kunjungan tanpa jebol anggaran.',
  },
  {
    ikon: '🍲',
    judul: 'Bakar dan suki sekaligus',
    isi: 'Kuah panas di sisi meja jalan bersama bara. Item Grill & Suki boleh dibakar atau dicelup — satu pesanan, dua cara makan.',
  },
  {
    ikon: '📱',
    judul: 'Pesan dari meja lewat QR',
    isi: 'Scan barcode di meja untuk memanggil waiter dan memantau pesanan. Tidak perlu berdiri, tidak perlu melambaikan tangan.',
  },
  {
    ikon: '⏱️',
    judul: 'Tusuk pertama cepat sampai',
    isi: 'Pesanan langsung tercetak ke station yang tepat — panggangan, suki, atau dapur — jadi tidak ada tiket nyangkut di tengah jalan.',
  },
];

const LANGKAH = [
  ['Ambil meja', 'Datang langsung atau reservasi lewat WhatsApp. Setiap meja punya panggangan sendiri.'],
  ['Scan QR di meja', 'Pesanan dicatat, waiter bisa dipanggil dari layar HP Anda.'],
  ['Pilih per tusuk', 'Campur bebas dari empat kelas sate, daging premium, dan isian suki.'],
  ['Bakar & makan', 'Bara sudah menyala saat tusukan datang. Ronde kedua tinggal pesan lagi dari meja.'],
];

export default function BerandaBbqiu() {
  const totalItem = MENU.reduce((n, k) => n + k.items.length, 0);

  return (
    <main>
      {/* ------------------------------------------------------------ HERO */}
      <section className="s-hero">
        <div className="s-wrap s-hero-in">
          <div className="s-hero-copy">
            <span className="s-eyebrow">BBQ · Shaokao · Suki</span>
            <h1 className="s-h1">
              Bara di meja Anda.<br />
              <span className="s-api-ember">Sepuasnya, mulai 3.900.</span>
            </h1>
            <p className="s-lead" style={{ maxWidth: 540 }}>
              {totalItem} tusukan dan potongan daging siap bakar, dipesan satuan.
              Tidak ada paket yang memaksa Anda membayar apa yang tidak dimakan —
              di BBQIU, besarnya pesta ditentukan meja Anda sendiri.
            </p>
            <div className="s-btns">
              <a
                className="s-btn s-btn-primary"
                href={waLink(`Halo ${BRAND.nama}, saya mau reservasi meja. Untuk berapa orang dan jam berapa yang masih tersedia?`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                🔥 Reservasi meja sekarang
              </a>
              <Link className="s-btn s-btn-ghost" href="/bbqiu/menu">
                Lihat menu &amp; harga
              </Link>
            </div>
            <div className="s-stats" style={{ marginTop: 34 }}>
              {ANGKA.map(([n, l]) => (
                <div key={l}>
                  <div className="s-stat-num">{n}</div>
                  <div className="s-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="s-flame">
            <div className="s-flame-emoji">🍢</div>
            <div className="s-flame-cap">
              <div className="s-card" style={{ padding: 18, background: 'rgba(16,11,9,.72)' }}>
                <span className="s-chip">Paling dicari</span>
                <div className="s-h3" style={{ marginTop: 10 }}>{PAKET.nama}</div>
                <p className="s-p" style={{ fontSize: 14.5, marginTop: 6 }}>{PAKET.ringkas}</p>
                <div className="s-stat-num" style={{ fontSize: 28, marginTop: 8 }}>{rupiah(PAKET.harga)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- MARQUEE */}
      <div className="s-marquee" aria-hidden="true">
        <div className="s-marquee-track">
          {[0, 1].map((i) => (
            <span key={i}>
              <span>Sate 3.900</span><span>·</span>
              <span>US Karubi</span><span>·</span>
              <span>Udang Jumbo</span><span>·</span>
              <span>Suki Steamboat</span><span>·</span>
              <span>Saikoro</span><span>·</span>
              <span>Beef Bacon</span><span>·</span>
              <span>Jamur Enoki</span><span>·</span>
              <span>Nasi Goreng Bawang</span><span>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- ALASAN */}
      <section className="s-sec">
        <div className="s-wrap">
          <span className="s-eyebrow">Kenapa BBQIU</span>
          <h2 className="s-h2" style={{ marginTop: 12, maxWidth: 720 }}>
            Restoran BBQ yang tidak menghukum Anda karena datang berdua
          </h2>
          <p className="s-lead" style={{ marginTop: 16, maxWidth: 660 }}>
            Kebanyakan tempat panggangan menjual paket besar. Kami menjual
            tusukan. Bedanya terasa di struk — dan di seberapa sering orang
            kembali.
          </p>

          <div className="s-grid s-g3" style={{ marginTop: 38 }}>
            {ALASAN.map((a) => (
              <div key={a.judul} className="s-card s-card-hover">
                <div style={{ fontSize: 30 }}>{a.ikon}</div>
                <h3 className="s-h3" style={{ marginTop: 14 }}>{a.judul}</h3>
                <p className="s-p" style={{ marginTop: 9, fontSize: 15 }}>{a.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- UNGGULAN */}
      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <span className="s-eyebrow">Yang paling sering dipesan</span>
              <h2 className="s-h2" style={{ marginTop: 12 }}>Enam alasan orang balik lagi</h2>
            </div>
            <Link className="s-btn s-btn-ghost s-btn-sm" href="/bbqiu/produk">Semua produk unggulan →</Link>
          </div>

          <div className="s-grid s-g3" style={{ marginTop: 34 }}>
            {UNGGULAN.map((u) => (
              <article key={u.nama} className="s-card s-card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{u.ikon}</span>
                  <span className="s-chip">{rupiah(u.harga)}</span>
                </div>
                <h3 className="s-h3" style={{ marginTop: 14 }}>{u.nama}</h3>
                <p className="s-p" style={{ marginTop: 9, fontSize: 15 }}>{u.kenapa}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- LANGKAH */}
      <section className="s-sec">
        <div className="s-wrap">
          <span className="s-eyebrow">Cara makan di BBQIU</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Empat langkah, tanpa bingung</h2>
          <div className="s-grid s-g4" style={{ marginTop: 34 }}>
            {LANGKAH.map(([judul, isi], i) => (
              <div key={judul} className="s-card">
                <div className="s-step">
                  <div className="s-step-num">{i + 1}</div>
                  <div>
                    <h3 className="s-h3" style={{ fontSize: 17 }}>{judul}</h3>
                    <p className="s-p" style={{ marginTop: 8, fontSize: 14.5 }}>{isi}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- KEMITRAAN */}
      <section className="s-sec s-band">
        <div className="s-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 34, alignItems: 'center' }}>
          <div>
            <span className="s-eyebrow" style={{ color: '#4a1d05' }}>Peluang kerjasama</span>
            <h2 className="s-h2" style={{ marginTop: 12, color: '#1a0d06' }}>
              Bawa bara BBQIU ke kota Anda
            </h2>
            <p className="s-lead" style={{ marginTop: 14, maxWidth: 520 }}>
              Kami membuka kemitraan outlet, pemasok, event, dan kolaborasi brand.
              Merek, resep, rantai pasok, dan sistem kasirnya sudah jalan — Anda
              tidak perlu memulai dari nol.
            </p>
            <div className="s-btns" style={{ marginTop: 24 }}>
              <Link className="s-btn" style={{ background: '#1a0d06', color: '#ffd9a1' }} href="/bbqiu/kemitraan">
                Lihat skema kemitraan
              </Link>
              <a
                className="s-btn s-btn-ghost"
                style={{ borderColor: 'rgba(26,13,6,.35)', color: '#1a0d06', background: 'rgba(255,255,255,.28)' }}
                href={waLink(`Halo ${BRAND.nama}, saya tertarik jadi mitra. Boleh minta proposal kemitraannya?`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Minta proposal
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {[
              ['🏪', 'Mitra Outlet', 'Booth express sampai resto penuh'],
              ['🚚', 'Mitra Pemasok', 'Kontrak volume bulanan'],
              ['🎪', 'Event & Katering', 'Panggangan datang ke tempat Anda'],
              ['🤝', 'Kolaborasi Brand', 'Promo bersama di meja & struk'],
            ].map(([ikon, judul, isi]) => (
              <div
                key={judul}
                style={{
                  display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px',
                  borderRadius: 16, background: 'rgba(255,255,255,.3)', border: '1px solid rgba(26,13,6,.16)',
                }}
              >
                <span style={{ fontSize: 24 }}>{ikon}</span>
                <div>
                  <div style={{ fontWeight: 900, color: '#1a0d06' }}>{judul}</div>
                  <div style={{ fontSize: 14, color: 'rgba(26,13,6,.78)' }}>{isi}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- CTA AKHIR */}
      <section className="s-sec">
        <div className="s-wrap" style={{ textAlign: 'center' }}>
          <h2 className="s-h2" style={{ maxWidth: 720, margin: '0 auto' }}>
            Meja paling ramai adalah meja yang sudah dipesan
          </h2>
          <p className="s-lead" style={{ marginTop: 16, maxWidth: 560, marginInline: 'auto' }}>
            Akhir pekan dan malam gajian biasanya penuh sebelum jam 19.00.
            Amankan meja Anda lewat WhatsApp — balasannya cepat.
          </p>
          <div className="s-btns" style={{ justifyContent: 'center', marginTop: 26 }}>
            <a
              className="s-btn s-btn-primary"
              href={waLink(`Halo ${BRAND.nama}, saya mau reservasi meja.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reservasi via WhatsApp
            </a>
            <Link className="s-btn s-btn-ghost" href="/bbqiu/kontak">Lihat lokasi &amp; jam buka</Link>
          </div>
        </div>
      </section>

      <div className="s-float">
        <a
          className="s-btn s-btn-primary"
          href={waLink(`Halo ${BRAND.nama}, saya mau reservasi meja.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          🔥 Reservasi via WhatsApp
        </a>
      </div>
    </main>
  );
}
