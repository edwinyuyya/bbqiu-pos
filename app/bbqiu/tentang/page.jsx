import Link from 'next/link';
import { BRAND, waLink } from '../../../lib/situs';

export const metadata = {
  title: 'Tentang Kami',
  description:
    'BBQIU lahir dari satu keberatan sederhana: kenapa makan BBQ harus mahal dan harus ramai-ramai? Ini cerita, nilai, dan standar dapur kami.',
};

const NILAI = [
  {
    ikon: '⚖️',
    judul: 'Harga jujur, tertulis',
    isi: 'Harga di meja sama dengan harga di struk. Tidak ada biaya panggangan, tidak ada biaya arang, tidak ada kejutan di akhir.',
  },
  {
    ikon: '🧊',
    judul: 'Segar, bukan sisa kemarin',
    isi: 'Daging dan sayur dicatat tanggal datangnya di sistem gudang. Barang yang mendekati batas simpan diberi peringatan otomatis dan tidak naik ke panggangan.',
  },
  {
    ikon: '🧑‍🍳',
    judul: 'Bumbu satu tangan',
    isi: 'Marinasi dan saus dibuat dengan takaran tertulis, bukan kira-kira. Rasa tusuk pertama Anda tahun ini sama dengan tahun lalu.',
  },
  {
    ikon: '🧼',
    judul: 'Panggangan bersih tiap tamu',
    isi: 'Jaring panggangan diganti setiap pergantian tamu. Bara yang kotor merusak rasa daging sebagus apa pun.',
  },
];

const STANDAR = [
  ['Rantai dingin', 'Daging disimpan pada suhu terkontrol dari gudang sampai meja, dengan pencatatan penerimaan barang per tanggal.'],
  ['Kartu resep', 'Setiap menu punya resep dan hitungan bahan yang tersimpan di sistem, sehingga porsi tidak melar atau menyusut tergantung siapa yang masak.'],
  ['Opname rutin', 'Stok dihitung fisik dan dibandingkan dengan catatan. Selisih ditelusuri, bukan dibiarkan.'],
  ['Susut dipisah', 'Serpihan potong dicatat terpisah dari barang rusak, supaya kelalaian tidak bisa bersembunyi di balik biaya wajar.'],
];

const PERJALANAN = [
  ['Awal', 'Satu panggangan, satu ide: BBQ enak tidak harus berarti tagihan ratusan ribu per orang.'],
  ['Menu terbentuk', 'Empat kelas sate disusun — 3.900, 6.900, 9.900, dan 14.900 — supaya satu meja bisa berisi mahasiswa dan keluarga sekaligus.'],
  ['Suki masuk', 'Kuah ditambahkan di sisi meja. Tamu bertahan lebih lama dan pesanan ronde kedua naik.'],
  ['Sistem dipasang', 'QR meja, cetak otomatis per station, kontrol stok, dan laporan harian. Operasional berhenti bergantung pada ingatan orang.'],
  ['Sekarang', 'Menu aktif menembus 79 item dan kemitraan dibuka untuk kota lain.'],
];

export default function TentangPage() {
  return (
    <main>
      <section className="s-hero" style={{ padding: '76px 0 40px' }}>
        <div className="s-wrap" style={{ position: 'relative', maxWidth: 820 }}>
          <span className="s-eyebrow">Tentang {BRAND.nama}</span>
          <h1 className="s-h1" style={{ marginTop: 14 }}>
            Kami menjual tusukan,<br />
            <span className="s-api-ember">bukan paket mahal.</span>
          </h1>
          <p className="s-lead" style={{ marginTop: 22 }}>
            BBQIU berangkat dari satu keberatan sederhana. Untuk makan BBQ yang
            layak, orang biasanya harus memesan paket besar, datang beramai-ramai,
            dan membayar untuk makanan yang tidak sempat dimakan. Kami membalik
            urutannya: harga per tusuk, panggangan di setiap meja, dan tamu yang
            menentukan sendiri seberapa besar pestanya.
          </p>
        </div>
      </section>

      <section className="s-sec-tight">
        <div className="s-wrap">
          <div className="s-grid s-g2">
            <div className="s-card">
              <span className="s-chip">Yang kami percaya</span>
              <h2 className="s-h3" style={{ marginTop: 14, fontSize: 24 }}>
                Makan di luar itu soal kebersamaan, bukan soal siapa yang mampu bayar
              </h2>
              <p className="s-p" style={{ marginTop: 14 }}>
                Panggangan di tengah meja memaksa orang berhenti menatap layar.
                Ada yang membalik daging, ada yang menjaga jangan sampai gosong,
                ada yang mengurus kuah. Itu bagian yang dibawa pulang tamu — dan
                itu tidak bisa dijual per porsi.
              </p>
              <p className="s-p" style={{ marginTop: 12 }}>
                Karena itu harga terendah di menu kami sengaja dibuat sangat
                rendah. Sate 3.900 bukan menu pemanis; itu pintu masuk supaya
                siapa pun bisa duduk di meja yang sama.
              </p>
            </div>

            <div className="s-card" style={{ display: 'grid', placeItems: 'center', background: 'radial-gradient(80% 70% at 50% 110%, rgba(255,90,54,.35), transparent 70%)' }}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 78 }}>🔥</div>
                <div className="s-h3" style={{ marginTop: 16, fontSize: 22 }}>
                  “Bara di meja, harga di tangan Anda.”
                </div>
                <p className="s-p" style={{ marginTop: 10 }}>Prinsip yang dipakai untuk semua keputusan menu.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap">
          <span className="s-eyebrow">Nilai kami</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Empat hal yang tidak kami tawar</h2>
          <div className="s-grid s-g4" style={{ marginTop: 32 }}>
            {NILAI.map((n) => (
              <div key={n.judul} className="s-card s-card-hover">
                <div style={{ fontSize: 28 }}>{n.ikon}</div>
                <h3 className="s-h3" style={{ marginTop: 12, fontSize: 17 }}>{n.judul}</h3>
                <p className="s-p" style={{ marginTop: 8, fontSize: 14.5 }}>{n.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap s-grid s-g2" style={{ alignItems: 'start' }}>
          <div>
            <span className="s-eyebrow">Standar dapur</span>
            <h2 className="s-h2" style={{ marginTop: 12 }}>Rasa yang sama, setiap malam</h2>
            <p className="s-lead" style={{ marginTop: 16 }}>
              Restoran gagal bukan karena satu malam buruk, tapi karena rasanya
              berubah-ubah. Empat hal berikut yang menjaga BBQIU tetap konsisten.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {STANDAR.map(([judul, isi], i) => (
              <div key={judul} className="s-card s-step">
                <div className="s-step-num">{i + 1}</div>
                <div>
                  <h3 className="s-h3" style={{ fontSize: 17 }}>{judul}</h3>
                  <p className="s-p" style={{ marginTop: 6, fontSize: 14.5 }}>{isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-sec" style={{ background: 'var(--s-bg2)' }}>
        <div className="s-wrap">
          <span className="s-eyebrow">Perjalanan</span>
          <h2 className="s-h2" style={{ marginTop: 12 }}>Dari satu panggangan ke satu sistem</h2>
          <div style={{ marginTop: 32, display: 'grid', gap: 12 }}>
            {PERJALANAN.map(([fase, isi]) => (
              <div key={fase} className="s-card" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20 }}>
                <div className="s-h3" style={{ color: 'var(--s-gold)' }}>{fase}</div>
                <p className="s-p" style={{ fontSize: 15 }}>{isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap" style={{ textAlign: 'center' }}>
          <h2 className="s-h2">Cara tercepat mengenal kami: duduk di mejanya</h2>
          <div className="s-btns" style={{ justifyContent: 'center', marginTop: 24 }}>
            <a className="s-btn s-btn-primary" href={waLink(`Halo ${BRAND.nama}, saya mau reservasi meja.`)} target="_blank" rel="noopener noreferrer">
              Reservasi meja
            </a>
            <Link className="s-btn s-btn-ghost" href="/bbqiu/menu">Lihat menu lengkap</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
