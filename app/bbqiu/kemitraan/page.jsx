import Link from 'next/link';
import FormMitra from './FormMitra';
import {
  BRAND, FAQ_MITRA, PAKET_MITRA, PROSES_MITRA, SKEMA_KERJASAMA, rupiah, waLink,
} from '../../../lib/situs';

export const metadata = {
  title: 'Peluang Kerjasama',
  description:
    'Buka outlet BBQIU di kota Anda, jadi pemasok, atau bawa panggangan kami ke acara Anda. Skema kemitraan, rincian paket, proses, dan tanya jawab.',
};

const DUKUNGAN = [
  ['🎯', 'Merek yang sudah dikenal', 'Anda tidak perlu menjelaskan konsep dari nol. Nama, logo, dan gaya menunya sudah punya bentuk.'],
  ['📖', 'Resep & bumbu terstandar', 'Marinasi dan saus dikirim dari pusat dengan takaran tetap, jadi rasa outlet Anda sama dengan outlet pertama.'],
  ['💻', 'Sistem operasional lengkap', 'QR meja, cetak otomatis ke station, kontrol stok, HPP, sampai laporan omzet harian — semuanya ikut dalam paket.'],
  ['🧑‍🏫', 'Pelatihan kru', 'Kru Anda dilatih di outlet yang sedang berjalan, bukan sekadar diberi buku panduan.'],
  ['🚚', 'Rantai pasok terpusat', 'Daging dan bumbu dipasok dengan harga kontrak, sehingga margin Anda tidak bergantung pada harga pasar harian.'],
  ['📣', 'Dukungan pembukaan', 'Materi promosi, skema promo pembukaan, dan pendampingan minggu pertama.'],
];

const KENAPA_ANGKA = [
  ['4', 'kelas harga sate', 'Meja bisa diisi mahasiswa dan keluarga sekaligus — jangkauan pasar lebih lebar.'],
  ['79+', 'item menu', 'Tamu punya alasan datang kembali tanpa outlet harus mengganti menu.'],
  ['2', 'cara makan per item', 'Grill & Suki dijual sekali, dipakai dua cara. Stok lebih sederhana, pilihan tamu lebih banyak.'],
  ['1', 'sistem terpasang', 'Pesanan, stok, dan laporan berada dalam satu sistem sejak hari pertama buka.'],
];

export default function KemitraanPage() {
  return (
    <main>
      {/* ------------------------------------------------------------ HERO */}
      <section className="s-hero" style={{ padding: '80px 0 44px' }}>
        <div className="s-wrap s-hero-in">
          <div className="s-hero-copy">
            <span className="s-eyebrow">Peluang kerjasama</span>
            <h1 className="s-h1">
              Bisnis BBQ yang<br />
              <span className="s-api-ember">sudah teruji di meja.</span>
            </h1>
            <p className="s-lead" style={{ maxWidth: 540 }}>
              Kami membuka kemitraan untuk kota-kota baru. Yang Anda ambil bukan
              hanya merek: resep, pemasok, pelatihan, dan sistem kasir yang sudah
              dipakai setiap malam ikut di dalamnya.
            </p>
            <div className="s-btns">
              <a
                className="s-btn s-btn-primary"
                href={waLink(`Halo ${BRAND.nama}, saya tertarik jadi mitra. Boleh minta proposal kemitraannya?`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                🤝 Minta proposal sekarang
              </a>
              <a className="s-btn s-btn-ghost" href="#form">Isi formulir minat</a>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {KENAPA_ANGKA.map(([n, l, k]) => (
              <div key={l} className="s-card" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 18 }}>
                <div className="s-stat-num" style={{ fontSize: 32, minWidth: 62 }}>{n}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{l}</div>
                  <p className="s-p" style={{ fontSize: 13.5, marginTop: 3 }}>{k}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- SKEMA */}
      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap">
          <span className="s-eyebrow">Empat pintu masuk</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Pilih bentuk kerjasama yang cocok</h2>
          <p className="s-lead" style={{ marginTop: 14, maxWidth: 640 }}>
            Tidak semua orang ingin membuka restoran. Ada yang punya lahan, ada
            yang punya pasokan, ada yang punya jaringan acara. Semuanya bisa
            bekerja sama dengan kami.
          </p>

          <div className="s-grid s-g4" style={{ marginTop: 34 }}>
            {SKEMA_KERJASAMA.map((s) => (
              <article key={s.nama} className="s-card s-card-hover">
                <div style={{ fontSize: 30 }}>{s.ikon}</div>
                <h3 className="s-h3" style={{ marginTop: 12 }}>{s.nama}</h3>
                <p className="s-p" style={{ marginTop: 9, fontSize: 14.5 }}>{s.ringkas}</p>
                <ul className="s-list" style={{ marginTop: 12 }}>
                  {s.poin.map((p) => <li key={p} style={{ fontSize: 13.5 }}>{p}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- PAKET */}
      <section className="s-sec">
        <div className="s-wrap">
          <span className="s-eyebrow">Paket mitra outlet</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Tiga skala, satu standar rasa</h2>
          <p className="s-lead" style={{ marginTop: 14, maxWidth: 640 }}>
            Angka di bawah adalah gambaran awal. Rincian resmi — termasuk royalti,
            biaya sistem, dan proyeksi omzet — dikirim dalam proposal setelah
            Anda menghubungi kami.
          </p>

          <div className="s-grid s-g3" style={{ marginTop: 36 }}>
            {PAKET_MITRA.map((p) => (
              <article key={p.nama} className={`s-card s-price-card${p.unggulan ? ' pop' : ''}`}>
                {p.unggulan && <span className="s-price-tag">Paling diminati</span>}
                <div>
                  <h3 className="s-h3" style={{ fontSize: 22 }}>{p.nama}</h3>
                  <p className="s-p" style={{ marginTop: 6, fontSize: 14 }}>{p.cocok}</p>
                </div>

                <div>
                  <div className="s-price-num">
                    {p.investasi ? `Mulai ${rupiah(p.investasi)}` : 'Skema khusus'}
                  </div>
                  <p className="s-p" style={{ fontSize: 13.5, marginTop: 4 }}>
                    Estimasi balik modal {p.balik} · {p.ukuran}
                  </p>
                </div>

                <ul className="s-list">
                  {p.isi.map((i) => <li key={i}>{i}</li>)}
                </ul>

                <a
                  className={`s-btn ${p.unggulan ? 's-btn-primary' : 's-btn-ghost'}`}
                  style={{ marginTop: 'auto' }}
                  href={waLink(`Halo ${BRAND.nama}, saya tertarik dengan paket kemitraan "${p.nama}". Boleh minta rincian lengkapnya?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tanya paket ini
                </a>
              </article>
            ))}
          </div>

          <p className="s-p" style={{ marginTop: 20, fontSize: 13.5 }}>
            Estimasi balik modal bergantung pada lokasi, sewa, dan jumlah kunjungan
            harian. Angka tersebut bukan janji hasil.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- DUKUNGAN */}
      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap">
          <span className="s-eyebrow">Yang Anda terima</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Enam hal yang tidak perlu Anda bangun sendiri</h2>
          <div className="s-grid s-g3" style={{ marginTop: 34 }}>
            {DUKUNGAN.map(([ikon, judul, isi]) => (
              <div key={judul} className="s-card s-card-hover">
                <div style={{ fontSize: 28 }}>{ikon}</div>
                <h3 className="s-h3" style={{ marginTop: 12, fontSize: 17.5 }}>{judul}</h3>
                <p className="s-p" style={{ marginTop: 8, fontSize: 14.5 }}>{isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- PROSES */}
      <section className="s-sec">
        <div className="s-wrap">
          <span className="s-eyebrow">Prosesnya</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Dari chat pertama sampai grand opening</h2>
          <div className="s-grid s-g3" style={{ marginTop: 34 }}>
            {PROSES_MITRA.map(([judul, isi], i) => (
              <div key={judul} className="s-card s-step">
                <div className="s-step-num">{i + 1}</div>
                <div>
                  <h3 className="s-h3" style={{ fontSize: 17 }}>{judul}</h3>
                  <p className="s-p" style={{ marginTop: 7, fontSize: 14.5 }}>{isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FORM */}
      <section className="s-sec" id="form" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap s-grid s-g2" style={{ alignItems: 'start' }}>
          <div>
            <span className="s-eyebrow">Mulai percakapan</span>
            <h2 className="s-h2" style={{ marginTop: 12 }}>
              Satu chat sekarang lebih berguna daripada riset tiga bulan
            </h2>
            <p className="s-lead" style={{ marginTop: 16 }}>
              Kami akan bertanya balik soal lokasi, modal, dan kesiapan waktu
              Anda — dan akan mengatakan terus terang kalau menurut kami rencana
              itu belum layak jalan. Mencegah satu outlet gagal jauh lebih murah
              daripada memperbaikinya.
            </p>
            <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
              {[
                ['📞', `WhatsApp: +${BRAND.wa}`],
                ['✉️', BRAND.email],
                ['📍', BRAND.alamat],
              ].map(([ikon, teks]) => (
                <div key={teks} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{ikon}</span>
                  <span className="s-p" style={{ fontSize: 15 }}>{teks}</span>
                </div>
              ))}
            </div>
          </div>

          <FormMitra />
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <section className="s-sec">
        <div className="s-wrap" style={{ maxWidth: 820 }}>
          <span className="s-eyebrow">Tanya jawab</span>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 26 }}>Pertanyaan yang paling sering masuk</h2>
          {FAQ_MITRA.map(([t, j]) => (
            <details key={t} className="s-faq">
              <summary>{t}</summary>
              <p className="s-p">{j}</p>
            </details>
          ))}

          <div className="s-btns" style={{ marginTop: 34 }}>
            <a
              className="s-btn s-btn-primary"
              href={waLink(`Halo ${BRAND.nama}, saya masih ada pertanyaan soal kemitraan.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Pertanyaan saya belum terjawab
            </a>
            <Link className="s-btn s-btn-ghost" href="/bbqiu/tentang">Kenali dulu BBQIU</Link>
          </div>
        </div>
      </section>

      <div className="s-float">
        <a
          className="s-btn s-btn-primary"
          href={waLink(`Halo ${BRAND.nama}, saya tertarik jadi mitra.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          🤝 Minta proposal kemitraan
        </a>
      </div>
    </main>
  );
}
