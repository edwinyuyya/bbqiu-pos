import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { sendNotif } from '../../../../lib/notify';
import { ulangTahunDalam, umurTahunIni, hariIniWIB } from '../../../../lib/pelanggan';

export const dynamic = 'force-dynamic';

// GET /api/cron/ulang-tahun — daftar pelanggan yang berulang tahun 7 hari ke depan.
//
// Penyaringan tanggalnya dikerjakan di sini, bukan di query: yang dibandingkan
// hanya bulan dan tanggal, sementara tahun lahirnya diabaikan. Query "birth_date
// between hari ini dan 7 hari lagi" tidak akan pernah menemukan siapa pun,
// karena tahun lahirnya puluhan tahun lalu.
export async function GET(req) {
  const db = supabaseServer();
  const hari = Math.min(31, Math.max(1, Number(new URL(req.url).searchParams.get('hari')) || 7));

  const { data: semua } = await db
    .from('customers')
    .select('id, name, phone, birth_date, visit_count')
    .not('birth_date', 'is', null);

  const hariIni = hariIniWIB();
  const daftar = [];
  for (const c of semua || []) {
    const u = ulangTahunDalam(c.birth_date, hari, hariIni);
    if (u) daftar.push({ ...c, ...u, umur: umurTahunIni(c.birth_date, u.tanggal) });
  }
  daftar.sort((a, b) => a.dalamHari - b.dalamHari);

  if (!daftar.length) {
    return NextResponse.json({ ok: true, jumlah: 0, terkirim: false });
  }

  const baris = daftar.map((c) => {
    const kapan = c.dalamHari === 0 ? 'HARI INI'
      : c.dalamHari === 1 ? 'besok'
      : `${c.dalamHari} hari lagi (${c.tanggal})`;
    return `• ${c.name} — ${c.phone}\n  ${kapan}${c.umur ? ` · ${c.umur} th` : ''} · sudah ${c.visit_count}× datang`;
  });

  const teks =
    `🎂 Ulang tahun pelanggan ${hari} hari ke depan (${daftar.length} orang)\n\n` +
    baris.join('\n') +
    '\n\nKirim ucapan lewat WhatsApp ke nomor di atas.';

  const terkirim = await sendNotif(teks);
  return NextResponse.json({ ok: true, jumlah: daftar.length, terkirim, daftar });
}
