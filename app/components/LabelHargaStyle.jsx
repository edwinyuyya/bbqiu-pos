// Ukuran halaman cetak khusus lembar label harga (A4, dipotong sendiri).
//
// Dulu aturan ini ada di globals.css. Karena @page berlaku ke seluruh dokumen
// dan tidak bisa dibatasi per elemen, "size: A4" di sana menang atas
// "size: 58mm auto" milik struk termal — aturan yang datang belakangan yang
// dipakai. Akibatnya setiap cetakan termal di seluruh aplikasi dilayout di
// atas A4 lalu diperkecil printer ke 58mm: label QR meja keluar sekitar 13mm
// dan QR-nya tidak bisa discan sama sekali.
//
// Dipasang di badan halaman supaya cakupannya hanya rute label harga.
export default function LabelHargaStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: '@media print { @page { size: A4; margin: 8mm; } }',
      }}
    />
  );
}
