// Urutan nomor meja secara alami: "AC 2" sebelum "AC 10".
//
// Postgres dan JavaScript sama-sama mengurutkan teks huruf per huruf, jadi
// "AC 10" jatuh tepat sesudah "AC 1" — di layar penuh 20 kartu meja, meja
// yang baru ditambahkan seolah-olah hilang karena tidak berada di tempat
// yang dicari orang. Perbandingan numerik menaruhnya di urutan yang wajar.

const pembanding = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

export function bandingNomorMeja(a, b) {
  return pembanding.compare(String(a ?? ''), String(b ?? ''));
}

export function urutkanMeja(daftar) {
  return [...(daftar || [])].sort((a, b) => bandingNomorMeja(a?.table_number, b?.table_number));
}
