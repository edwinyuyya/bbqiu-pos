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
