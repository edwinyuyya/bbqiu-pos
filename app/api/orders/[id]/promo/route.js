import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';
import { cekPromo, cekMinSpend, normalisasiKode, promoNominal } from '../../../../../lib/promo';
import { recalcOrder } from '../../../../../lib/recalcOrder';

export const dynamic = 'force-dynamic';

// POST /api/orders/:id/promo  { code }  -> pasang kode promo
export async function POST(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const kode = normalisasiKode(body.code);
  if (!kode) return NextResponse.json({ error: 'Kode promo wajib diisi' }, { status: 400 });

  const { data: order } = await db
    .from('orders').select('id, status, payment_status').eq('id', id).maybeSingle();
  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  if (['closed', 'cancelled'].includes(order.status))
    return NextResponse.json({ error: 'Bill sudah ditutup — tidak bisa diubah' }, { status: 400 });
  if (order.payment_status === 'paid')
    return NextResponse.json(
      { error: 'Bill sudah lunas — diskon harus dipasang sebelum pembayaran' },
      { status: 400 }
    );

  const { data: promo } = await db
    .from('promos').select('*').ilike('code', kode).maybeSingle();

  const sah = cekPromo(promo);
  if (!sah.ok) return NextResponse.json({ error: sah.alasan }, { status: 400 });

  // Syarat minimum belanja diperiksa SEBELUM dipasang, bukan dibiarkan lolos
  // lalu diam-diam memberi potongan nol. Kasir yang melihat kode "berhasil"
  // tapi totalnya tidak berubah akan mengira sistemnya rusak, lalu memberi
  // potongan manual.
  if (promo.min_spend) {
    const kering = await recalcOrder(db, id, null);   // hitung tanpa promo dulu
    const cekMin = cekMinSpend(promo, kering?.setelah_diskon ?? 0);
    if (!cekMin.ok) {
      return NextResponse.json({ error: cekMin.alasan }, { status: 400 });
    }
  }

  // Jatah pemakaian DIKUNCI lebih dulu, sebelum diskonnya dihitung, dan
  // hanya berhasil kalau used_count masih sama persis seperti saat dibaca.
  //
  // cekPromo() di atas tidak cukup untuk kode sekali pakai: dua kasir yang
  // memasang kode yang sama pada detik yang sama sama-sama membaca 0,
  // sama-sama lolos, lalu sama-sama menulis 1 — dan dua bill mendapat
  // potongan dari kode yang jatahnya cuma satu.
  const jatahTerbatas = Number(promo.max_uses) > 0;
  const sebelum = Number(promo.used_count || 0);
  if (jatahTerbatas) {
    const { data: klaim } = await db
      .from('promos')
      .update({ used_count: sebelum + 1 })
      .eq('id', promo.id)
      .eq('used_count', sebelum)
      .select('id');
    if (!klaim || !klaim.length) {
      return NextResponse.json(
        { error: 'Kode ini baru saja dipakai di bill lain. Muat ulang halamannya.' },
        { status: 409 }
      );
    }
  }

  const hasil = await recalcOrder(db, id, promo);

  // Potongan nominal yang berakhir nol berarti syaratnya tidak terpenuhi —
  // jangan sampai terpasang seolah berhasil.
  if (promoNominal(promo) > 0 && !hasil?.cashback) {
    await recalcOrder(db, id, null);
    // Jatah yang tadi dikunci dikembalikan: kodenya tidak jadi dipakai, jadi
    // tidak boleh ikut hangus.
    if (jatahTerbatas) {
      await db.from('promos')
        .update({ used_count: sebelum })
        .eq('id', promo.id).eq('used_count', sebelum + 1);
    }
    return NextResponse.json(
      { error: hasil?.kurang_min_spend
          ? `Belanja minimal Rp ${hasil.kurang_min_spend.min.toLocaleString('id-ID')}. `
            + `Saat ini baru Rp ${Math.round(hasil.kurang_min_spend.dasar).toLocaleString('id-ID')}.`
          : 'Kode ini tidak bisa dipakai pada bill ini.' },
      { status: 400 }
    );
  }
  if (!jatahTerbatas) {
    await db.from('promos').update({ used_count: sebelum + 1 }).eq('id', promo.id);
  }

  return NextResponse.json({
    ok: true,
    promo: { code: promo.code, name: promo.name },
    sekali_pakai: Number(promo.max_uses) === 1,
    ...hasil,
  });
}

// DELETE /api/orders/:id/promo -> lepas kode promo (diskon per menu tetap jalan)
export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { data: order } = await db
    .from('orders').select('id, status, payment_status, promo_id').eq('id', id).maybeSingle();
  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  if (['closed', 'cancelled'].includes(order.status) || order.payment_status === 'paid')
    return NextResponse.json({ error: 'Bill sudah final — tidak bisa diubah' }, { status: 400 });

  const hasil = await recalcOrder(db, id, null);
  let hangus = null;
  if (order.promo_id) {
    const { data: p } = await db
      .from('promos').select('code, used_count, max_uses').eq('id', order.promo_id).maybeSingle();
    if (p) {
      // Kode BERJATAH tidak dipulihkan saat dilepas. "Sekali pakai langsung
      // hangus" berarti hangus: kalau jatahnya kembali tiap kali kode
      // dilepas, kode sekali-pakai bisa dipakai berkali-kali cukup dengan
      // memasang lalu melepasnya di bill berikutnya — dan tidak ada jejak
      // apa pun yang menunjukkan itu terjadi.
      //
      // Salah pasang tetap bisa diperbaiki, tapi oleh owner lewat tombol
      // reset di admin, bukan diam-diam oleh kasir.
      if (Number(p.max_uses) > 0) {
        hangus = { code: p.code, terpakai: Number(p.used_count || 0), max: Number(p.max_uses) };
      } else {
        await db.from('promos')
          .update({ used_count: Math.max(0, (p.used_count || 0) - 1) })
          .eq('id', order.promo_id);
      }
    }
  }
  return NextResponse.json({ ok: true, hangus, ...hasil });
}
