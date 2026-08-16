// Ukuran halaman cetak khusus label QR meja.
//
// globals.css sudah mengunci @page ke 58mm auto untuk struk termal, dan label
// meja memang dicetak di printer yang sama. Deklarasi ini dipasang ulang di
// badan halaman supaya rute cetak label tidak bergantung pada urutan pemuatan
// stylesheet: yang datang belakangan menang, dan cakupannya hanya rute ini.
//
// Pernah disetel 70mm x 100mm dengan anggapan labelnya dicetak di printer
// kertas lebar. Printer yang benar-benar ada di warung 58mm, jadi labelnya
// terpotong 22mm dan QR-nya tidak bisa discan.
export default function QrLabelStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: '@media print { @page { size: 58mm auto; margin: 0; } }',
      }}
    />
  );
}
