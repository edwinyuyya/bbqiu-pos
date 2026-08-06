import Link from 'next/link';
import { site, waLink } from '@/data/site';

export const metadata = {
  title: 'Cara Kerja',
  description:
    'Enam langkah dari obrolan pertama sampai perjalanan selesai — termasuk apa yang kami siapkan dan apa yang perlu Anda siapkan.',
};

const langkah = [
  {
    t: 'Obrolan awal, tanpa biaya',
    j:
      'Ceritakan tujuan Anda: ziarah, laku dengan ujub tertentu, atau sekadar ingin memahami ' +
      'warisan leluhur. Tidak ada yang perlu Anda bayar di tahap ini, dan tidak ada kewajiban ' +
      'melanjutkan. Kalau menurut kami perjalanan ini belum tepat untuk situasi Anda, kami akan ' +
      'mengatakannya terus terang.',
  },
  {
    t: 'Penyusunan rencana & rincian biaya',
    j:
      'Kami kirim rancangan rute, jadwal jam per jam, siapa yang akan mendampingi, dan rincian ' +
      'biaya lengkap — transport, penginapan, tiket, uborampe, sampai penghormatan untuk juru ' +
      'kunci. Semuanya tertulis sebelum Anda mengeluarkan uang sepeser pun.',
  },
  {
    t: 'Uang muka & pengunciAn tanggal',
    j:
      'Uang muka 30 persen mengunci kendaraan, penginapan, dan jadwal juru kunci. Transfer ke ' +
      'rekening atas nama badan usaha, bukan rekening pribadi siapa pun. Kuitansi resmi kami ' +
      'kirim setiap kali Anda membayar.',
  },
  {
    t: 'Persiapan sebelum berangkat',
    j:
      'Kami kirim daftar barang bawaan, aturan busana tiap lokasi, dan pantangan yang perlu ' +
      'dijaga. Untuk laku tertentu, ada persiapan yang dimulai beberapa hari sebelumnya — puasa ' +
      'mutih misalnya — dan itu kami sampaikan jauh hari, bukan mendadak.',
  },
  {
    t: 'Hari keberangkatan',
    j:
      'Pengemudi menjemput sesuai titik yang disepakati. Pendamping menemani sepanjang ' +
      'perjalanan, mengurus izin dan komunikasi dengan juru kunci, serta memastikan adab tiap ' +
      'lokasi terjaga. Anda tinggal menjalani, tidak perlu memikirkan urusan teknis.',
  },
  {
    t: 'Setelah pulang',
    j:
      'Kami kirim dokumentasi bila Anda memesannya, dan tetap terbuka untuk ditanyai soal ' +
      'lanjutan laku Anda. Tidak ada tagihan susulan, dan tidak ada telepon yang mendesak Anda ' +
      'membeli ritual tambahan. Kalau ada yang menghubungi Anda mengatasnamakan kami untuk itu, ' +
      'tolong laporkan kepada kami.',
  },
];

const siapkan = [
  'Kartu identitas asli — beberapa lokasi wajib mendaftarkan nama peserta.',
  'Pakaian sopan dan tertutup. Untuk Imogiri, busana adat disewakan di lokasi dan sudah kami masukkan biayanya.',
  'Alas kaki yang nyaman. Beberapa lokasi punya ratusan anak tangga.',
  'Obat pribadi, terutama bila Anda punya riwayat asma, jantung, atau tekanan darah.',
  'Jaket tebal untuk destinasi dataran tinggi seperti Dieng dan Lawu.',
  'Kejujuran soal kondisi kesehatan Anda. Ini yang paling penting — kami tidak bisa menjaga apa yang tidak kami ketahui.',
];

export default function HalamanCaraKerja() {
  return (
    <>
      <section className="bagian">
        <div className="bungkus">
          <span className="kop">Alurnya</span>
          <h1>Cara Kerja</h1>
          <p className="utama">
            Dari obrolan pertama sampai Anda pulang, enam langkah. Kami tuliskan supaya Anda tahu
            persis apa yang akan terjadi — dan tahu kapan ada yang tidak beres.
          </p>

          <div style={{ display: 'grid', gap: 18, marginTop: 40 }}>
            {langkah.map((l, i) => (
              <div
                key={l.t}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  gap: 22,
                  alignItems: 'start',
                  paddingBottom: 18,
                  borderBottom:
                    i === langkah.length - 1 ? 'none' : '1px solid var(--garis)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '2rem',
                    color: 'var(--emas)',
                    lineHeight: 1,
                    minWidth: 48,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 style={{ marginBottom: 6 }}>{l.t}</h3>
                  <p style={{ color: 'var(--teks-lembut)', marginBottom: 0 }}>{l.j}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bagian bagian-alt">
        <div className="bungkus">
          <div className="kisi kisi-2">
            <div>
              <span className="kop">Bagian Anda</span>
              <h2>Yang perlu Anda siapkan</h2>
              <ul className="daftar-centang jarak-atas">
                {siapkan.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="kop">Bagian kami</span>
              <h2>Yang kami urus</h2>
              <ul className="daftar-centang jarak-atas">
                <li>Kendaraan, pengemudi, BBM, tol, dan parkir</li>
                <li>Izin masuk dan penjadwalan dengan juru kunci atau pengelola resmi</li>
                <li>Tiket masuk, sewa busana adat, dan retribusi lokasi</li>
                <li>Uborampe sesuai laku yang akan dijalankan</li>
                <li>Penginapan, makan, dan air minum sesuai paket</li>
                <li>Pendamping perjalanan dan, bila diperlukan, pendamping spiritual</li>
                <li>Asuransi perjalanan untuk seluruh peserta</li>
                <li>Pemantauan cuaca dan status gunung sampai hari keberangkatan</li>
              </ul>
            </div>
          </div>

          <div className="catatan jarak-atas-besar" style={{ maxWidth: '76ch' }}>
            <strong>Kalau kami yang membatalkan.</strong> Cuaca buruk, status gunung naik, atau
            akses lokasi ditutup mendadak — itu di luar kendali siapa pun. Bila kami yang
            membatalkan, seluruh uang Anda kembali penuh atau dijadwalkan ulang, terserah pilihan
            Anda. Kami tidak akan memaksakan keberangkatan demi menyelamatkan pemasukan.
          </div>

          <div className="tumpuk jarak-atas">
            <a
              className="tombol tombol-wa"
              href={waLink(`Halo ${site.nama}, saya ingin memulai obrolan awal soal rencana perjalanan.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mulai dari langkah pertama
            </a>
            <Link className="tombol tombol-garis" href="/paket">
              Lihat harga dulu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
