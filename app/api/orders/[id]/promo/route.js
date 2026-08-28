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

  const hasil = await recalcOrder(db, id, promo);

  // Potongan nominal yang berakhir nol berarti syaratnya tidak terpenuhi —
  // jangan sampai terpasang seolah berhasil.
  if (promoNominal(promo) > 0 && !hasil?.cashback) {
    await recalcOrder(db, id, null);
    return NextResponse.json(
      { error: hasil?.kurang_min_spend
          ? `Belanja minimal Rp ${hasil.kurang_min_spend.min.toLocaleString('id-ID')}. `
            + `Saat ini baru Rp ${Math.round(hasil.kurang_min_spend.dasar).toLocaleString('id-ID')}.`
          : 'Kode ini tidak bisa dipakai pada bill ini.' },
      { status: 400 }
    );
  }
  await db.from('promos').update({ used_count: (promo.used_count || 0) + 1 }).eq('id', promo.id);

  return NextResponse.json({ ok: true, promo: { code: promo.code, name: promo.name }, ...hasil });
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
  if (order.promo_id) {
    const { data: p } = await db
      .from('promos').select('used_count').eq('id', order.promo_id).maybeSingle();
    if (p) {
      await db.from('promos')
        .update({ used_count: Math.max(0, (p.used_count || 0) - 1) })
        .eq('id', order.promo_id);
    }
  }
  return NextResponse.json({ ok: true, ...hasil });
}
