import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';
import { recalcOrder } from '../../../../../lib/recalcOrder';

export const dynamic = 'force-dynamic';

// POST /api/orders/:id/split  { items: [{ id, qty }], catatan? }
//
// Memindahkan sebagian item ke BILL BARU di meja yang sama. Bill hasil pisahan
// berdiri sendiri: bisa ditandai lunas, ditutup, dicetak, dan dikirim ke WA
// tanpa menyentuh bill asalnya.
//
// Dibuat sebagai bill sungguhan, bukan sekadar hitungan di layar kasir. Kalau
// hanya dihitung, dua tamu yang membayar terpisah tetap tercatat sebagai satu
// tagihan — dan begitu salah satunya sudah bayar, tidak ada tempat untuk
// menuliskannya.
export async function POST(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const minta = Array.isArray(b.items) ? b.items : [];
  if (!minta.length) {
    return NextResponse.json({ error: 'Pilih dulu item yang mau dipisah.' }, { status: 400 });
  }

  const { data: asal } = await db.from('orders').select('*').eq('id', id).maybeSingle();
  if (!asal) return NextResponse.json({ error: 'Bill tidak ditemukan' }, { status: 404 });

  if (['closed', 'cancelled'].includes(asal.status)) {
    return NextResponse.json({ error: 'Bill sudah ditutup — tidak bisa dipisah.' }, { status: 400 });
  }
  // Bill yang sudah lunas tidak boleh dipisah: uangnya sudah diterima utuh,
  // dan memecahnya membuat jumlah yang dibayar tidak lagi cocok dengan
  // tagihan mana pun.
  if (asal.payment_status === 'paid') {
    return NextResponse.json(
      { error: 'Bill ini sudah lunas. Pisahkan sebelum pembayaran diterima.' },
      { status: 400 }
    );
  }

  const { data: semua } = await db
    .from('order_items').select('*').eq('order_id', id).is('cancelled_at', null);
  const perId = Object.fromEntries((semua || []).map((it) => [it.id, it]));

  // Validasi dulu SELURUH permintaan sebelum menyentuh satu baris pun —
  // pemindahan yang gagal di tengah meninggalkan dua bill yang sama-sama salah.
  const rencana = [];
  for (const m of minta) {
    const it = perId[m.id];
    if (!it) return NextResponse.json({ error: 'Ada item yang sudah tidak ada di bill ini.' }, { status: 400 });
    const q = Math.max(1, parseInt(m.qty, 10) || it.qty);
    if (q > it.qty) {
      return NextResponse.json(
        { error: `Jumlah "${it.name}" melebihi yang ada di bill (${it.qty}).` },
        { status: 400 }
      );
    }
    rencana.push({ it, q });
  }

  const totalAda = (semua || []).reduce((s, it) => s + Number(it.qty), 0);
  const totalPindah = rencana.reduce((s, r) => s + r.q, 0);
  if (totalPindah >= totalAda) {
    return NextResponse.json(
      { error: 'Tidak bisa memindahkan seluruh isi bill — sisakan minimal satu porsi di bill asal.' },
      { status: 400 }
    );
  }

  const { data: baru, error: eBaru } = await db.from('orders').insert({
    table_id: asal.table_id,
    table_number: asal.table_number,
    status: 'open',
    payment_method: asal.payment_method,
    payment_status: 'unpaid',
    customer_name: b.nama_pelanggan?.toString().slice(0, 80) || asal.customer_name,
    note: `Pisahan dari bill #${asal.order_no}`,
    split_from_order_id: asal.id,
    subtotal: 0, tax: 0, total: 0,
  }).select().single();
  if (eBaru || !baru) {
    return NextResponse.json({ error: 'Gagal membuat bill pisahan' }, { status: 500 });
  }

  for (const { it, q } of rencana) {
    if (q === it.qty) {
      // Seluruh baris pindah — tidak perlu memecah apa pun.
      await db.from('order_items').update({ order_id: baru.id }).eq('id', it.id);
    } else {
      // Sebagian saja: sisakan di bill asal, salin sisanya ke bill baru.
      await db.from('order_items').update({ qty: it.qty - q }).eq('id', it.id);
      const { id: _lama, order_id: _o, created_at: _c, ...sisa } = it;
      await db.from('order_items').insert({ ...sisa, order_id: baru.id, qty: q });
    }
  }

  // Dua-duanya dihitung ulang lewat jalur yang sama dengan promo & pembatalan,
  // supaya tidak ada rumus total kedua yang bisa menyimpang.
  const hasilAsal = await recalcOrder(db, asal.id);
  const hasilBaru = await recalcOrder(db, baru.id);

  return NextResponse.json({
    ok: true,
    asal: { id: asal.id, order_no: asal.order_no, total: hasilAsal?.total ?? 0 },
    baru: { id: baru.id, order_no: baru.order_no, total: hasilBaru?.total ?? 0 },
  });
}
