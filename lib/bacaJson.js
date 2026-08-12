// Membaca respons API dengan aman.
//
// `await res.json()` langsung akan melempar "Unexpected end of JSON input"
// kalau server membalas dengan badan kosong — dan itu yang terjadi tiap kali
// route-nya crash sebelum sempat mengirim apa pun. Pesan itu tidak berarti
// apa-apa bagi pelanggan yang sedang memesan di meja, dan menyembunyikan
// kenyataan bahwa yang rusak adalah sistemnya, bukan cara dia memesan.
//
// Pernah terjadi sungguhan: satu salah ketik nama variabel membuat seluruh
// pemesanan gagal, dan yang terbaca di layar pelanggan hanya kalimat itu.
export async function bacaJson(res) {
  const teks = await res.text();

  if (!teks.trim()) {
    if (res.ok) return {};
    throw new Error(
      'Sistem sedang bermasalah dan tidak bisa memproses pesanan. ' +
      'Panggil staf kami ya — pesanan bisa dicatat lewat kasir.'
    );
  }

  try {
    return JSON.parse(teks);
  } catch {
    // Balasan bukan JSON: biasanya halaman error dari penyedia hosting.
    throw new Error(
      'Sistem sedang bermasalah. Panggil staf kami ya — pesanan bisa dicatat lewat kasir.'
    );
  }
}
