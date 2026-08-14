// Ukuran halaman cetak khusus label QR meja.
//
// globals.css mengunci @page ke 58mm dengan tinggi auto untuk struk termal.
// Aturan itu berlaku ke SELURUH dokumen dan tidak bisa dibatasi per elemen,
// jadi label meja ikut tercetak di atas kertas struk yang sempit memanjang.
// Halaman cetak label memasang ulang @page lewat <style> di badan halaman:
// deklarasi yang datang belakangan menang, dan cakupannya hanya rute ini.
export default function QrLabelStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: '@media print { @page { size: 70mm 100mm; margin: 0; } }',
      }}
    />
  );
}
