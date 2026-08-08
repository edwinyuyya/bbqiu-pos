// Aturan alur pesanan.
//
// WAJIB_BAYAR_DULU = true  -> pesanan BARU diteruskan ke dapur hanya setelah
// bill-nya lunas. Selama belum lunas, pesanan tidak muncul di Kitchen Display
// dan tidak boleh dicetak ke station.
//
// Konsekuensi yang perlu diingat: pembayaran QRIS di sini tidak otomatis
// terverifikasi (tidak ada callback dari bank), jadi kasir tetap harus menekan
// "Tandai Lunas" setelah mengecek mutasi. Selama itu belum dilakukan, dapur
// tidak akan melihat pesanannya sama sekali.
//
// Ubah ke false untuk kembali ke perilaku lama (dapur langsung memasak,
// pembayaran menyusul di akhir).
export const WAJIB_BAYAR_DULU = true;

export const PESAN_MENUNGGU_BAYAR =
  'Pesanan diteruskan ke dapur setelah pembayaran diterima.';
