// Daftar station dapur, dipakai bersama Kitchen Display, struk dapur, dan
// dashboard owner supaya urutan & namanya tidak pernah beda antar layar.
//
// Alur shao kao ada DUA tahap: item digoreng dulu di station Goreng, baru
// pindah ke station Bakaran. Karena itu Goreng berada di urutan pertama.
export const STATIONS = [
  { id: 'goreng',     name: 'Goreng',      cetak: 'STATION GORENG',     cls: 'station-goreng' },
  { id: 'shaokao',    name: 'Bakaran',     cetak: 'STATION BAKARAN',    cls: 'station-shaokao' },
  { id: 'maincourse', name: 'Maincourse',  cetak: 'STATION MAINCOURSE', cls: 'station-maincourse' },
  { id: 'bar',        name: 'Bar Minuman', cetak: 'BAR MINUMAN',        cls: 'station-bar' },
];

export const STATION_IDS = STATIONS.map((s) => s.id);

// Tahap pertama & kedua untuk menu yang harus digoreng dulu.
export const STATION_GORENG = 'goreng';
export const STATION_BAKARAN = 'shaokao';

export function stationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || 'Tanpa station';
}
