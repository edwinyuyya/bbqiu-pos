// Kirim WhatsApp "semi otomatis" lewat link wa.me (click-to-chat).
// Tidak butuh API berbayar dan tidak butuh opt-in seperti CallMeBot:
// staf menekan tombol, WhatsApp terbuka dengan nomor + pesan sudah terisi,
// tinggal tekan kirim. Satu ketukan manual, sisanya otomatis.

// wa.me minta format internasional tanpa "+", spasi, atau strip.
// 08123456789 -> 628123456789
export function nomorWA(input) {
  if (!input) return null;
  let d = String(input).replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.startsWith('62')) {
    // sudah internasional
  } else if (d.startsWith('0')) {
    d = `62${d.slice(1)}`;
  } else if (d.startsWith('8')) {
    // pelanggan sering menulis tanpa 0 di depan
    d = `62${d}`;
  } else {
    return null; // bukan nomor Indonesia yang dikenali
  }
  // 62 + 9..13 digit. Di luar itu hampir pasti salah ketik.
  if (d.length < 11 || d.length > 15) return null;
  return d;
}

export function linkWA(nomor, pesan) {
  const n = nomorWA(nomor);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(pesan)}`;
}

// --- Template pesan antrian ---

// Link status disertakan supaya pelanggan yang keburu menutup tab
// bisa kembali memantau antriannya.
function ekorPesan(link, merchant) {
  return `${link ? `\nPantau status: ${link}\n` : ''}\n— ${merchant}`;
}

export function pesanMejaSiap({ nama, queueNo, meja, area, tenggatMenit, merchant, link }) {
  return (
    `Halo ${nama}, meja Anda sudah siap! 🎉\n\n` +
    `Antrian #${queueNo}\n` +
    `Meja ${meja}${area ? ` (${area})` : ''}\n\n` +
    `Mohon segera menuju meja dalam ${tenggatMenit} menit ya. ` +
    `Terima kasih sudah menunggu.\n` +
    ekorPesan(link, merchant)
  );
}

export function pesanHampirGiliran({ nama, queueNo, sisaDepan, merchant, link }) {
  return (
    `Halo ${nama}, sebentar lagi giliran Anda 🙂\n\n` +
    `Antrian #${queueNo}\n` +
    (sisaDepan > 0
      ? `Tinggal ${sisaDepan} grup lagi di depan Anda.\n`
      : `Anda berikutnya.\n`) +
    `\nMohon bersiap di dekat restoran ya.\n` +
    ekorPesan(link, merchant)
  );
}

export function pesanMasihMenunggu({ nama, queueNo, estimasi, merchant }) {
  return (
    `Halo ${nama}, terima kasih sudah mendaftar antrian.\n\n` +
    `Antrian #${queueNo}\n` +
    `Perkiraan menunggu: ${estimasi}\n\n` +
    `Kami kabari lagi kalau meja sudah siap.\n\n` +
    `— ${merchant}`
  );
}
