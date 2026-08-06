import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Nama env var per peran. Alias disediakan karena nama yang mirip sangat
// mudah tertukar saat mengetik di dashboard Vercel (STOCK vs STOK,
// CASHIER vs KASIR) — dan kalau tertukar, sistem diam-diam jatuh ke
// STAFF_PIN sehingga PIN baru "tidak pernah mempan" tanpa pesan apa pun.
const PIN_ENV = {
  staff:  [],
  owner:  ['OWNER_PIN'],
  admin:  ['ADMIN_PIN'],
  kasir:  ['KASIR_PIN', 'CASHIER_PIN'],
  dapur:  ['DAPUR_PIN', 'KITCHEN_PIN'],
  stok:   ['STOK_PIN', 'STOCK_PIN', 'GUDANG_PIN'],
  waiter: ['WAITER_PIN', 'PELAYAN_PIN'],
  spv:    ['SPV_PIN'],
};

const SCOPES = Object.keys(PIN_ENV);
function normScope(s) {
  return SCOPES.includes(s) ? s : 'staff';
}

// env.example menaruh komentar di baris yang sama, mis.
//   STOK_PIN=          # Gudang / Stok & belanja - kosong = pakai STAFF_PIN
// Kalau baris itu ikut ter-paste ke kolom Value di Vercel, nilainya jadi
// PIN + komentar dan tidak akan pernah cocok. Ambil bagian sebelum '#'
// dan buang spasi di ujung.
function bersihkan(v) {
  if (v == null) return '';
  let s = String(v).trim();
  const tanda = s.indexOf('#');
  if (tanda > 0) s = s.slice(0, tanda).trim();
  return s;
}

// Env var pertama yang terisi, urut sesuai prioritas, lalu STAFF_PIN.
function pinInfo(scope) {
  for (const nama of [...(PIN_ENV[scope] || []), 'STAFF_PIN']) {
    const mentah = process.env[nama];
    if (mentah != null && String(mentah).trim() !== '') {
      return { pin: bersihkan(mentah), sumber: nama, mentah: String(mentah) };
    }
  }
  return { pin: '', sumber: null, mentah: '' };
}

// Catatan konfigurasi yang aman ditampilkan: menyebut MASALAH-nya, bukan
// isi PIN-nya. Ini yang membuat salah konfigurasi kelihatan, bukan cuma
// berujung "PIN salah" berulang-ulang tanpa petunjuk.
function catatanKonfigurasi(scope, info) {
  const catatan = [];
  if (!info.sumber) return catatan;
  const utama = (PIN_ENV[scope] || [])[0];
  if (info.mentah !== info.mentah.trim()) catatan.push('nilainya ada spasi di awal/akhir');
  if (info.mentah.includes('#')) catatan.push('nilainya mengandung tanda # (komentar ikut ter-copy)');
  if (utama && info.sumber === 'STAFF_PIN') catatan.push(`${utama} belum terisi, jadi memakai STAFF_PIN`);
  else if (utama && info.sumber !== utama) catatan.push(`memakai ${info.sumber}, bukan ${utama}`);
  return catatan;
}

// GET /api/pin?scope=...  -> apakah PIN diperlukan + petunjuk konfigurasi
export async function GET(req) {
  const scope = normScope(new URL(req.url).searchParams.get('scope'));
  const info = pinInfo(scope);
  return NextResponse.json({
    required: !!info.pin,
    sumber: info.sumber,
    catatan: catatanKonfigurasi(scope, info),
  });
}

// POST /api/pin  { pin, scope }  -> verifikasi
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const scope = normScope(body.scope);
  const info = pinInfo(scope);
  if (!info.pin) return NextResponse.json({ ok: true }); // tidak diset -> bebas
  const diberikan = String(body.pin ?? '').trim();
  return NextResponse.json({ ok: diberikan === info.pin });
}
