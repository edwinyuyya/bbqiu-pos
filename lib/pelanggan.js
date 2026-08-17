// Aturan program pelanggan BBQIU.
//
// Dikumpulkan di satu berkas supaya kasir, API, dan laporan memakai definisi
// yang sama — bukan tiga tafsiran yang perlahan berbeda sendiri.

// Hadiah diberikan pada kunjungan ke berapa, dan hanya sekali seumur pelanggan.
export const KUNJUNGAN_HADIAH = 3;

// Pilihan menu hadiah. Nama harus persis sama dengan nama menu di sistem,
// karena hadiahnya dimasukkan sebagai baris order sungguhan (bukan catatan),
// supaya nilainya ikut terlihat di laporan.
export const MENU_HADIAH = ['Fillet ayam', 'Sawi Putih', 'Sawi sendok'];

// Tanggal hari ini menurut WIB. Batas hari UTC jatuh pukul 07:00 waktu Solo,
// jadi memakai tanggal UTC akan menghitung tamu malam sebagai hari berikutnya.
export function hariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

// Berhak hadiah? Sudah cukup sering datang DAN belum pernah mengambil.
export function berhakHadiah(pelanggan) {
  if (!pelanggan) return false;
  if (pelanggan.reward_claimed_at) return false;
  return Number(pelanggan.visit_count || 0) >= KUNJUNGAN_HADIAH;
}

// Berapa kunjungan lagi menuju hadiah (0 = sudah berhak, null = sudah diambil).
export function sisaMenujuHadiah(pelanggan) {
  if (!pelanggan || pelanggan.reward_claimed_at) return null;
  return Math.max(0, KUNJUNGAN_HADIAH - Number(pelanggan.visit_count || 0));
}

// Ulang tahun dalam N hari ke depan, tahun diabaikan.
//
// Perbandingan memakai bulan-tanggal, bukan selisih tanggal penuh: tanggal
// lahir 1990 tidak akan pernah "dalam 7 hari ke depan" kalau dihitung utuh.
// Pergantian tahun ikut ditangani — 28 Desember melihat sampai 3 Januari.
export function ulangTahunDalam(birthDate, hari = 7, dariISO = hariIniWIB()) {
  if (!birthDate) return null;
  const l = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(l.getTime())) return null;
  const dari = new Date(`${dariISO}T00:00:00Z`);

  for (let i = 0; i <= hari; i++) {
    const d = new Date(dari.getTime() + i * 86400000);
    if (d.getUTCMonth() === l.getUTCMonth() && d.getUTCDate() === l.getUTCDate()) {
      return { dalamHari: i, tanggal: d.toISOString().slice(0, 10) };
    }
  }
  return null;
}

export function umurTahunIni(birthDate, dariISO = hariIniWIB()) {
  if (!birthDate) return null;
  const l = Number(birthDate.slice(0, 4));
  const t = Number(dariISO.slice(0, 4));
  if (!l || !t) return null;
  return t - l;
}
