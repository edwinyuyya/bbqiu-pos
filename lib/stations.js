// Daftar station dapur, dipakai bersama Kitchen Display, struk dapur, dan
// dashboard owner supaya urutan & namanya tidak pernah beda antar layar.
//
// Goreng & bakaran shao kao dikerjakan orang yang sama di satu tempat, jadi
// keduanya SATU station. Kebutuhan "digoreng dulu" tetap dicatat per item
// (order_items.fry_first) dan tampil sebagai keterangan pada layar & struk —
// bukan sebagai perpindahan antar station yang menambah langkah.
export const STATIONS = [
  { id: 'shaokao',    name: 'Shaokao',     cetak: 'STATION SHAOKAO',    cls: 'station-shaokao' },
  { id: 'maincourse', name: 'Maincourse',  cetak: 'STATION MAINCOURSE', cls: 'station-maincourse' },
  { id: 'bar',        name: 'Bar Minuman', cetak: 'BAR MINUMAN',        cls: 'station-bar' },
];

export const STATION_IDS = STATIONS.map((s) => s.id);

export function stationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || 'Tanpa station';
}

// Label kelompok untuk layar & struk dapur.
//
// Kategori menu disusun untuk PELANGGAN — sate dipisah per harga (Sate
// 4.000, 7.000, 10.000, 15.000). Dapur tidak peduli tusuknya berapa ribu;
// yang perlu dibedakan adalah JENIS masakannya. Kalau dipakai apa adanya,
// 10 tusuk sate terpecah jadi 4 kelompok dan malah lebih sulit dibaca.
export function kelompokDapur(categoryName) {
  const c = (categoryName || '').trim();
  if (!c) return 'Lainnya';
  if (/^sate\b/i.test(c)) return 'Shao Kao';
  return c;
}

// Kelompokkan item satu station per jenis masakan, urut sesuai kemunculan.
export function perKelompokDapur(items) {
  const urut = [];
  const byKat = new Map();
  for (const it of items || []) {
    const kat = kelompokDapur(it.category_name);
    if (!byKat.has(kat)) { byKat.set(kat, []); urut.push(kat); }
    byKat.get(kat).push(it);
  }
  return urut.map((kat) => ({ kat, items: byKat.get(kat) }));
}
