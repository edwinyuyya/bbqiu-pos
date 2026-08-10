// Pencocokan teks untuk semua kolom pencarian.
//
// Disatukan di sini supaya perilakunya sama di mana-mana: staf yang hafal
// caranya mencari di daftar stok tidak perlu belajar ulang di daftar menu.
//
// Aturannya longgar dengan sengaja:
//   - huruf besar/kecil diabaikan
//   - tanda baca & kurung diabaikan, jadi "karubi (slice)" ketemu oleh "karubi slice"
//   - tiap kata dicari terpisah dan boleh acak urutannya, jadi "small karubi"
//     tetap menemukan "karubi small"
// Staf mengetik sambil melayani tamu; pencarian yang cerewet sama saja
// dengan tidak ada pencarian.

export function normalisasi(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// teks boleh string atau array (mis. [nama, kategori, catatan])
export function cocok(teks, kueri) {
  const q = normalisasi(kueri);
  if (!q) return true;
  const t = normalisasi(Array.isArray(teks) ? teks.filter(Boolean).join(' ') : teks);
  return q.split(' ').every((kata) => t.includes(kata));
}

export function saring(daftar, kueri, ambilTeks) {
  if (!normalisasi(kueri)) return daftar;
  return (daftar || []).filter((x) => cocok(ambilTeks(x), kueri));
}
