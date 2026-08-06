import DaftarDestinasi from './DaftarDestinasi';

export const metadata = {
  title: 'Destinasi',
  description:
    'Daftar tempat keramat, makam wali, candi, dan lokasi laku spiritual di Yogyakarta dan Jawa Tengah yang kami dampingi.',
};

export default function HalamanDestinasi() {
  return (
    <section className="bagian">
      <div className="bungkus">
        <span className="kop">Tujuan perjalanan</span>
        <h1>Destinasi</h1>
        <p className="utama">
          Sepuluh lokasi di Yogyakarta dan Jawa Tengah, dari yang bisa dijalani siapa saja sampai
          yang hanya kami berangkatkan setelah penyaringan kondisi kesehatan. Setiap halaman berisi
          sejarahnya, laku yang lazim dijalankan, uborampe yang diperlukan, dan adab yang wajib
          dijaga di sana.
        </p>

        <div className="jarak-atas">
          <DaftarDestinasi />
        </div>
      </div>
    </section>
  );
}
