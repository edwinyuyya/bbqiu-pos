// Reservasi + pra-pesanan.
//
// Prinsip yang menentukan seluruh rancangan ini: RESERVASI TIDAK MEMBLOKIR
// MEJA. Keterisian meja dihitung dari bill yang sedang berjalan, bukan dari
// jadwal reservasi. Jadi meja yang dijanjikan untuk tanggal 10 tetap bebas
// dipakai tamu walk-in hari ini — persis yang diminta.
//
// Konsekuensinya: table_id pada reservasi hanya RENCANA. Kalau saat tamu
// datang mejanya sedang terpakai, staf tinggal menugaskan meja lain dan
// pra-pesanannya ikut pindah.

export const STATUS = {
  BOOKED: 'booked',
  SEATED: 'seated',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const STATUS_LABEL = {
  booked: 'Terjadwal',
  seated: 'Sudah datang',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak datang',
};

// Status order untuk pra-pesanan. Sengaja di luar daftar status yang dipakai
// dapur & kasir (open/preparing/served), supaya tidak pernah ikut dimasak
// atau ditagih sebelum tamunya datang.
export const ORDER_TERJADWAL = 'scheduled';

export function tokenReservasi() {
  return `resv-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function hariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

export function jamRapi(t) {
  if (!t) return '';
  return String(t).slice(0, 5); // "19:00:00" -> "19:00"
}

export function tanggalRapi(d) {
  if (!d) return '';
  try {
    return new Date(`${d}T00:00:00+07:00`).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch { return d; }
}

// Sisa yang harus dibayar tamu saat datang.
export function sisaBayar(order, deposit = 0) {
  const total = Number(order?.total || 0);
  const sudah = Math.max(Number(order?.paid_amount || 0), Number(deposit || 0));
  return Math.max(0, total - sudah);
}

// Boleh diubah selama belum datang / belum dibatalkan.
export function bolehDiubah(resv) {
  return resv?.status === STATUS.BOOKED;
}

// Reservasi hari ini yang belum datang — dipakai untuk menandai meja
// "sedang direservasi" di layar staf. Penanda saja, bukan penguncian.
export function reservasiHariIni(daftar, tanggal = hariIniWIB()) {
  return (daftar || []).filter(
    (r) => r.reserved_date === tanggal && r.status === STATUS.BOOKED
  );
}
