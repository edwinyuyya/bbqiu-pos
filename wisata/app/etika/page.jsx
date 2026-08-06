import Link from 'next/link';
import { site, waLink } from '@/data/site';

export const metadata = {
  title: 'Janji & Etika Kami',
  description:
    'Apa yang kami janjikan, apa yang kami tolak, dan cara mengenali penipuan berkedok spiritual — supaya Anda aman, bahkan kalau tidak jadi memakai jasa kami.',
};

const tolak = [
  {
    t: 'Tumbal nyawa, dalam bentuk apa pun',
    j:
      'Baik manusia maupun hewan di luar aturan adat yang sah. Permintaan seperti ini kami tolak, ' +
      'dan bila menyangkut nyawa manusia akan kami laporkan kepada aparat.',
  },
  {
    t: 'Praktik seksual berkedok ritual',
    j:
      'Tidak ada laku sah dalam tradisi Jawa yang mensyaratkan hubungan badan dengan orang asing. ' +
      'Yang beredar selama ini adalah penyimpangan, dan sering menjadi kedok eksploitasi.',
  },
  {
    t: 'Apa pun yang bertujuan menyakiti orang lain',
    j:
      'Santet, teluh, pelet, atau permintaan agar seseorang celaka. Kami tidak melayaninya dan ' +
      'tidak menyambungkan Anda kepada siapa pun untuk itu.',
  },
  {
    t: 'Janji hasil dengan nominal tertentu',
    j:
      'Kami tidak menjual kepastian kaya, jodoh, kesembuhan, atau kemenangan perkara. Siapa pun ' +
      'yang menawarkannya kepada Anda sedang menipu — termasuk kalau suatu hari itu kami.',
  },
  {
    t: 'Peserta yang kondisinya tidak memungkinkan',
    j:
      'Untuk destinasi berat, peserta dengan gangguan jantung, vertigo, tekanan darah tinggi tak ' +
      'terkendali, kondisi kejiwaan yang sedang tidak stabil, atau sedang hamil, tidak kami ' +
      'berangkatkan. Berapa pun bayarannya.',
  },
  {
    t: 'Orang yang sedang dalam tekanan berat dan mendesak',
    j:
      'Bila seseorang datang dalam keadaan putus asa — terlilit utang, ditinggal orang tercinta, ' +
      'atau sedang mengalami krisis — kami tidak akan menjual paket apa pun hari itu juga. Kami ' +
      'sarankan menunda dan mencari pendampingan yang tepat lebih dulu.',
  },
];

const tanda = [
  'Menjanjikan hasil pasti: kaya dalam waktu tertentu, jodoh datang, penyakit sembuh, perkara menang.',
  'Meminta uang bertahap dengan alasan yang terus bertambah — mahar naik, syarat kurang, ada penghalang gaib.',
  'Menakut-nakuti Anda lebih dulu, lalu menawarkan diri sebagai satu-satunya penyelamat.',
  'Melarang Anda bercerita kepada keluarga atau siapa pun, dengan alasan tuahnya hilang.',
  'Meminta transfer ke rekening pribadi, tanpa kuitansi, tanpa identitas usaha yang jelas.',
  'Menolak diperkenalkan secara terbuka, atau tidak mau ditemui di tempat umum.',
  'Meminta hubungan badan, foto tanpa busana, atau data pribadi yang tidak ada hubungannya.',
  'Mengaku punya akses khusus ke sebuah tempat keramat yang katanya orang lain tidak punya.',
  'Mendesak Anda memutuskan hari itu juga, karena "harinya cuma hari ini".',
];

export default function HalamanEtika() {
  return (
    <>
      <section className="bagian">
        <div className="bungkus">
          <span className="kop">Dasar usaha ini</span>
          <h1 style={{ maxWidth: '19ch' }}>Janji &amp; Etika Kami</h1>
          <p className="utama" style={{ fontSize: '1.1rem' }}>
            Usaha ini berdiri karena terlalu sering kami mendengar cerita yang sama: seseorang
            datang dalam keadaan paling rapuh, lalu dikuras oleh orang yang mengaku punya kuasa.
            Halaman ini kami tulis supaya Anda aman — bahkan kalau pada akhirnya Anda tidak memakai
            jasa kami sama sekali.
          </p>
        </div>
      </section>

      {/* ---- Janji ---- */}
      <section className="bagian bagian-alt" style={{ paddingTop: 56 }}>
        <div className="bungkus">
          <h2>Empat hal yang kami pegang</h2>
          <div className="kisi kisi-2 jarak-atas">
            {site.janji.map((j, i) => (
              <div key={j.judul} className="kartu">
                <div className="kartu-isi">
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '1.5rem',
                      color: 'var(--emas)',
                      marginBottom: 8,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="kartu-judul" style={{ fontSize: '1.12rem' }}>
                    {j.judul}
                  </h3>
                  <p className="kartu-ringkas" style={{ marginBottom: 0 }}>
                    {j.isi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Yang kami tolak ---- */}
      <section className="bagian">
        <div className="bungkus">
          <span className="kop">Batas yang tidak kami lewati</span>
          <h2>Permintaan yang kami tolak</h2>
          <p className="utama">
            Daftar ini kami pasang terbuka supaya tidak ada yang perlu bernegosiasi. Uang tidak
            mengubah jawaban kami untuk hal-hal berikut.
          </p>

          <div style={{ display: 'grid', gap: 16, marginTop: 32 }}>
            {tolak.map((t) => (
              <div key={t.t} className="catatan">
                <strong style={{ display: 'block', marginBottom: 4, fontSize: '1.02rem' }}>
                  {t.t}
                </strong>
                {t.j}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Tanda penipuan ---- */}
      <section className="bagian bagian-alt">
        <div className="bungkus">
          <span className="kop">Bekal untuk siapa pun</span>
          <h2 style={{ maxWidth: '22ch' }}>Sembilan tanda Anda sedang ditipu</h2>
          <p className="utama">
            Simpan daftar ini, dan kirimkan ke siapa pun yang Anda sayangi. Kalau satu saja dari
            tanda berikut muncul, berhenti dulu dan bicarakan dengan orang yang Anda percaya
            sebelum mengeluarkan uang.
          </p>

          <div className="kartu jarak-atas">
            <div className="kartu-isi" style={{ padding: 28 }}>
              <ul className="daftar-centang" style={{ gap: 14 }}>
                {tanda.map((t) => (
                  <li key={t} style={{ fontSize: '0.98rem' }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="catatan jarak-atas" style={{ maxWidth: '76ch' }}>
            <strong>Kalau Anda sudah terlanjur menjadi korban,</strong> simpan seluruh bukti
            percakapan dan bukti transfer, lalu laporkan ke kepolisian setempat. Penipuan tetap
            penipuan, sekalipun dibungkus istilah spiritual, dan hukum tidak menganggapnya urusan
            gaib. Anda juga boleh menghubungi kami untuk sekadar ditemani berpikir — tanpa biaya,
            tanpa kami tawari paket apa pun.
          </div>

          <div className="tumpuk jarak-atas">
            <a
              className="tombol tombol-wa"
              href={waLink(
                `Halo ${site.nama}, saya ingin bertanya soal sesuatu yang mencurigakan yang saya alami.`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ceritakan tanpa biaya
            </a>
            <Link className="tombol tombol-garis" href="/faq">
              Baca tanya jawab
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
