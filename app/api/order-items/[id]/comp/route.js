import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';
import { sendNotif } from '../../../../../lib/notify';
import { recalcOrder } from '../../../../../lib/recalcOrder';

export const dynamic = 'force-dynamic';

// Kompliment: item tetap ada di nota, harganya jadi Rp 0.
//
// Sebelum ini kompliment diberikan dengan cara TIDAK memasukkannya ke nota
// sama sekali. Akibatnya dua hal yang sama-sama merugikan: stok bahannya
// tidak pernah terpotong — daging keluar dari kulkas tanpa jejak — dan tidak
// ada satu angka pun yang bisa menjawab "bulan ini kita bagi-bagi berapa".
//
// Karena itu item TIDAK dibatalkan dan TIDAK dihapus. Harganya saja yang
// dinolkan, harga normalnya disimpan di comp_price supaya nilainya tetap bisa
// dihitung, dan stok yang sudah terpotong dibiarkan terpotong — memang
// makanannya benar-benar keluar.
async function ambil(id, db) {
  const { data: item } = await db
    .from('order_items').select('*').eq('id', id).maybeSingle();
  if (!item) return { err: NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 }) };

  const { data: order } = await db
    .from('orders').select('*').eq('id', item.order_id).maybeSingle();
  if (!order) return { err: NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 }) };

  if (['closed', 'cancelled'].includes(order.status)) {
    return { err: NextResponse.json(
      { error: 'Bill sudah ditutup — tidak bisa mengubah itemnya.' }, { status: 400 }) };
  }
  // Bill lunas tidak boleh turun totalnya: uangnya sudah diterima penuh, dan
  // menurunkan tagihan sesudahnya membuat jumlah yang dibayar tidak cocok
  // dengan nota mana pun. Kompliment diputuskan sebelum menagih.
  if (order.payment_status === 'paid') {
    return { err: NextResponse.json(
      { error: 'Bill ini sudah lunas. Beri kompliment sebelum pembayaran diterima.' },
      { status: 400 }) };
  }
  if (item.cancelled_at) {
    return { err: NextResponse.json(
      { error: 'Item ini sudah dibatalkan.' }, { status: 400 }) };
  }
  return { item, order };
}

// POST /api/order-items/:id/comp  { reason, by } -> jadikan kompliment
export async function POST(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  // Alasan wajib. Kompliment tanpa alasan tidak bisa ditelusuri siapa pun
  // sebulan kemudian, dan itu persis keadaan yang mau ditinggalkan.
  const reason = (body.reason || '').toString().trim().slice(0, 200);
  if (!reason) return NextResponse.json({ error: 'Alasan kompliment wajib diisi' }, { status: 400 });
  const by = (body.by || '').toString().trim().slice(0, 80) || null;

  const { item, order, err } = await ambil(id, db);
  if (err) return err;
  if (item.complimentary) return NextResponse.json({ ok: true, sudah_kompliment: true });

  const hargaNormal = Number(item.comp_price ?? item.price);

  const { error: uErr } = await db.from('order_items').update({
    complimentary: true,
    comp_price: hargaNormal,
    comp_reason: reason,
    comp_by: by,
    comp_at: new Date().toISOString(),
    price: 0,
  }).eq('id', id);
  if (uErr) return NextResponse.json({ error: 'Gagal menyimpan kompliment' }, { status: 500 });

  const hasil = await recalcOrder(db, item.order_id);
  const nilai = hargaNormal * Number(item.qty);

  sendNotif(
    `🎁 *KOMPLIMENT*\nOrder #${order.order_no} · Meja ${order.table_number}\n`
    + `${item.qty}× ${item.name}\nNilai: Rp ${nilai.toLocaleString('id-ID')}\n`
    + `Alasan: ${reason}${by ? `\nOleh: ${by}` : ''}\n`
    + `Total baru: Rp ${(hasil?.total ?? 0).toLocaleString('id-ID')}`
  );

  return NextResponse.json({ ok: true, nilai, total: hasil?.total ?? 0 });
}

// DELETE /api/order-items/:id/comp -> batalkan kompliment, harga kembali
export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { item, order, err } = await ambil(id, db);
  if (err) return err;
  if (!item.complimentary) return NextResponse.json({ ok: true, bukan_kompliment: true });

  // comp_price adalah satu-satunya tempat harga aslinya disimpan. Kalau kosong
  // (data lama), lebih baik menolak daripada memulihkan harga tebakan.
  if (item.comp_price == null) {
    return NextResponse.json(
      { error: 'Harga asli item ini tidak tersimpan. Batalkan itemnya lalu input ulang.' },
      { status: 400 }
    );
  }

  const { error: uErr } = await db.from('order_items').update({
    complimentary: false,
    price: Number(item.comp_price),
    comp_reason: null, comp_by: null, comp_at: null,
  }).eq('id', id);
  if (uErr) return NextResponse.json({ error: 'Gagal membatalkan kompliment' }, { status: 500 });

  const hasil = await recalcOrder(db, item.order_id);
  sendNotif(
    `↩️ *KOMPLIMENT DIBATALKAN*\nOrder #${order.order_no} · Meja ${order.table_number}\n`
    + `${item.qty}× ${item.name} kembali ditagih\n`
    + `Total baru: Rp ${(hasil?.total ?? 0).toLocaleString('id-ID')}`
  );
  return NextResponse.json({ ok: true, total: hasil?.total ?? 0 });
}
