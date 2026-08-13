// Perhitungan diskon: kode promo (per bill) + diskon per menu (diatur admin).
//
// Aturan penting: diskon TIDAK ditumpuk. Kalau sebuah menu sudah punya diskon
// sendiri dan kode promo juga mengenainya, yang dipakai adalah yang paling
// besar — bukan dijumlahkan. Menumpuk 30% + 50% menghasilkan potongan 80%
// yang hampir pasti bukan maksud siapa pun.

export const SCOPE = {
  ALL: 'all',
  CATEGORIES: 'categories',
  EXCEPT_CATEGORIES: 'except_categories',
};

export const SCOPE_LABEL = {
  all: 'Semua menu',
  categories: 'Kategori tertentu',
  except_categories: 'Semua kecuali kategori tertentu',
};

// Tanggal hari ini menurut WIB, format YYYY-MM-DD.
export function hariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

export function normalisasiKode(kode) {
  return String(kode || '').trim().toLowerCase();
}

function persenAman(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}

// Apakah promo berlaku hari ini? Mengembalikan { ok, alasan }.
export function cekPromo(promo, tanggal = hariIniWIB()) {
  if (!promo) return { ok: false, alasan: 'Kode promo tidak ditemukan' };
  if (!promo.active) return { ok: false, alasan: 'Kode promo sedang dinonaktifkan' };
  if (promo.valid_from && tanggal < promo.valid_from)
    return { ok: false, alasan: `Kode baru berlaku mulai ${promo.valid_from}` };
  if (promo.valid_until && tanggal > promo.valid_until)
    return { ok: false, alasan: `Kode sudah kedaluwarsa (berlaku sampai ${promo.valid_until})` };
  if (persenAman(promo.percent) <= 0)
    return { ok: false, alasan: 'Persentase promo tidak valid' };
  return { ok: true };
}

// Apakah promo mengenai item ini? categoryId = kategori menu-nya.
//
// menuItemId dipakai untuk pengecualian per menu. Kategori saja tidak cukup:
// satu kategori à la carte bisa berisi item paket, dan "Nasi" ikut duduk di
// kategori Grill & Steamboat. Tanpa ini, promo yang dimaksudkan hanya untuk
// item à la carte ikut memotong harga paket.
export function promoKenaItem(promo, categoryId, menuItemId = null) {
  if (!promo) return false;
  if (menuItemId && (promo.exclude_menu_item_ids || []).includes(menuItemId)) return false;
  const daftar = promo.scope_category_ids || [];
  if (promo.scope === SCOPE.CATEGORIES) return daftar.includes(categoryId);
  if (promo.scope === SCOPE.EXCEPT_CATEGORIES) return !daftar.includes(categoryId);
  return true; // 'all'
}

// Hitung diskon seluruh bill.
// items: [{ id, price, qty, category_id, menu_item_id, discount_percent, cancelled_at }]
// promo: baris promos yang sudah lolos cekPromo(), atau null.
// Mengembalikan rincian per item + ringkasan, dengan pajak dihitung dari
// jumlah yang benar-benar ditagihkan (setelah diskon).
export function hitungDiskon(items, promo, taxPercent = 0, tanggal = hariIniWIB()) {
  const promoValid = promo && cekPromo(promo, tanggal).ok ? promo : null;
  const persenPromo = promoValid ? persenAman(promoValid.percent) : 0;

  const rincian = [];
  let subtotal = 0;
  let diskon = 0;

  for (const it of items || []) {
    if (it.cancelled_at) continue;
    const kotor = Number(it.price) * Number(it.qty);
    subtotal += kotor;

    const persenMenu = persenAman(it.discount_percent);
    // promo_eligible = false mengunci menu ini dari SEMUA kode promo, sekarang
    // dan yang dibuat nanti. Daftar pengecualian per promo tidak cukup: tiap
    // promo baru harus mengingat untuk mengecualikannya lagi, dan sekali lupa
    // harga paket terpotong tanpa ada yang protes. Sifat "tidak boleh didiskon"
    // melekat pada menunya, bukan pada promonya.
    const bolehPromo = it.promo_eligible !== false;
    const kenaPromo = persenPromo > 0 && bolehPromo
      && promoKenaItem(promoValid, it.category_id, it.menu_item_id);
    const persenDipakai = Math.max(persenMenu, kenaPromo ? persenPromo : 0);

    const potong = Math.round((kotor * persenDipakai) / 100);
    diskon += potong;

    let catatan = null;
    if (potong > 0) {
      catatan = kenaPromo && persenPromo >= persenMenu
        ? `${persenDipakai}% (${promoValid.code})`
        : `${persenDipakai}% (promo menu)`;
    }
    rincian.push({ id: it.id, kotor, persen: persenDipakai, potong, catatan });
  }

  const setelahDiskon = Math.max(0, subtotal - diskon);
  const pajak = Math.round((setelahDiskon * Number(taxPercent || 0)) / 100);

  return {
    rincian,
    subtotal,
    diskon,
    setelah_diskon: setelahDiskon,
    pajak,
    total: setelahDiskon + pajak,
  };
}

// Ringkasan lingkup promo untuk ditampilkan ke staf.
export function ringkasLingkup(promo, namaKategoriById = {}, namaMenuById = {}) {
  if (!promo) return '';
  const nama = (promo.scope_category_ids || [])
    .map((id) => namaKategoriById[id])
    .filter(Boolean)
    .join(', ');

  let dasar = 'Semua menu';
  if (promo.scope === SCOPE.CATEGORIES) dasar = nama ? `Hanya: ${nama}` : 'Hanya kategori tertentu';
  else if (promo.scope === SCOPE.EXCEPT_CATEGORIES) dasar = nama ? `Semua kecuali: ${nama}` : 'Semua kecuali kategori tertentu';

  // Pengecualian per menu ikut ditulis. Kasir yang ditanya tamu "kenapa nasi
  // saya tidak ikut diskon" harus bisa menjawabnya dari layar, bukan menebak.
  const kecuali = (promo.exclude_menu_item_ids || [])
    .map((id) => namaMenuById[id])
    .filter(Boolean);
  if (kecuali.length) dasar += ` · kecuali menu: ${kecuali.join(', ')}`;
  else if ((promo.exclude_menu_item_ids || []).length) {
    dasar += ` · kecuali ${promo.exclude_menu_item_ids.length} menu`;
  }

  return dasar;
}
