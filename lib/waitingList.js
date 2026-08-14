// Logika antrian tunggu (walk-in waiting list).
// Dipakai bersama API, halaman pelanggan, dan layar waiter.

// Berapa lama satu meja biasanya dipakai. Grill & steamboat itu makan lama,
// jadi tebakan awalnya panjang. Setelah ada cukup order yang sudah ditutup,
// angka ini diganti median durasi asli lewat durasiMejaMenit().
export const DURASI_DEFAULT_MENIT = 90;

// Butuh minimal sekian order selesai sebelum berani pakai data sendiri —
// di bawah itu mediannya terlalu goyah dan estimasinya malah menyesatkan.
export const MIN_SAMPEL_DURASI = 15;

// Batas waktu pelanggan datang setelah dipanggil, sebelum boleh ditandai
// tidak datang oleh waiter.
export const TENGGAT_PANGGIL_MENIT = 10;

export const STATUS_LABEL = {
  waiting: 'Menunggu',
  called: 'Dipanggil',
  seated: 'Sudah duduk',
  no_show: 'Tidak datang',
  cancelled: 'Dibatalkan',
};

export function menitSejak(iso, sekarang = Date.now()) {
  if (!iso) return 0;
  return Math.max(0, (sekarang - new Date(iso).getTime()) / 60000);
}

// Median durasi pemakaian meja dari order yang sudah ditutup.
// rows: [{ created_at, closed_at }]
export function durasiMejaMenit(rows) {
  const durasi = (rows || [])
    .filter((r) => r.created_at && r.closed_at)
    .map((r) => (new Date(r.closed_at) - new Date(r.created_at)) / 60000)
    // buang yang tidak masuk akal (salah input / meja lupa ditutup semalaman)
    .filter((m) => m >= 10 && m <= 360)
    .sort((a, b) => a - b);
  if (durasi.length < MIN_SAMPEL_DURASI) return DURASI_DEFAULT_MENIT;
  const t = Math.floor(durasi.length / 2);
  const med = durasi.length % 2 ? durasi[t] : (durasi[t - 1] + durasi[t]) / 2;
  return Math.round(med);
}

// Meja yang muat untuk rombongan ini.
// Meja tanpa data kursi (seats null) dianggap muat — supaya sistem tetap
// jalan sebelum kapasitas kursi selesai diisi.
//
// Kapasitas kursi jadi satu-satunya syarat: sejak meja diberi nomor polos
// 1-18 tanpa pengelompokan area, pelanggan tidak lagi memilih area saat
// mendaftar antrian.
export function mejaCocok(tables, { partySize }) {
  return (tables || []).filter((t) => {
    if (!t.active) return false;
    if (t.seats != null && Number(t.seats) < Number(partySize || 1)) return false;
    return true;
  });
}

// Perkiraan menunggu, dalam menit.
// mejaTerpakai: { [table_id]: created_at order yang masih open }
// posisi: urutan orang ini di antara antrian yang butuh meja sejenis (1 = paling depan)
export function estimasiMenit({ posisi, meja, mejaTerpakai, durasiMenit }) {
  if (!meja || meja.length === 0) return null;
  const sekarang = Date.now();
  const sisaPerMeja = meja
    .map((t) => {
      const mulai = mejaTerpakai?.[t.id];
      if (!mulai) return 0; // meja kosong sekarang
      return Math.max(0, durasiMenit - menitSejak(mulai, sekarang));
    })
    .sort((a, b) => a - b);

  const idx = Math.max(0, (posisi || 1) - 1);
  const putaran = Math.floor(idx / sisaPerMeja.length);
  const sisaIdx = idx % sisaPerMeja.length;
  return Math.round(sisaPerMeja[sisaIdx] + putaran * durasiMenit);
}

// Tampilkan estimasi sebagai rentang, bukan angka pasti — menjanjikan
// "15 menit" lalu molor jadi 50 jauh lebih bikin marah daripada
// "sekitar 15-25 menit" sejak awal.
export function estimasiTeks(menit) {
  if (menit == null) return 'Belum bisa diperkirakan';
  if (menit <= 0) return 'Meja sedang kosong, tinggal disiapkan';
  const bawah = Math.max(5, Math.round(menit / 5) * 5);
  const atas = Math.round((bawah * 1.4) / 5) * 5;
  if (bawah >= 120) return 'Lebih dari 2 jam';
  return `sekitar ${bawah}–${atas} menit`;
}

// Urutan orang ini di antrian, dihitung hanya terhadap antrian yang
// memperebutkan meja sejenis (kapasitas mirip).
export function posisiDalamAntrian(daftar, entri, tables) {
  const cocokSaya = new Set(mejaCocok(tables, {
    partySize: entri.party_size,
  }).map((t) => t.id));
  if (cocokSaya.size === 0) return null;
  let posisi = 1;
  for (const d of daftar) {
    if (d.id === entri.id) break;
    if (d.status !== 'waiting' && d.status !== 'called') continue;
    const cocokDia = mejaCocok(tables, {
      partySize: d.party_size,
    }).map((t) => t.id);
    // hanya hitung kalau dia memperebutkan meja yang sama dengan saya
    if (cocokDia.some((id) => cocokSaya.has(id))) posisi += 1;
  }
  return posisi;
}
