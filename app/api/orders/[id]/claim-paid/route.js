import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';
import { sendNotif, rupiahWA } from '../../../../../lib/notify';

export const dynamic = 'force-dynamic';

// POST /api/orders/:id/claim-paid
// Dipanggil pelanggan setelah scan QRIS & merasa sudah bayar. TIDAK menandai
// order "Lunas" secara resmi — hanya klaim + notifikasi staf untuk verifikasi
// manual di aplikasi bank sebelum kasir menekan "Tandai Lunas".
export async function POST(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { data: order, error } = await db
    .from('orders')
    .update({ customer_claimed_paid: true, claimed_paid_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error || !order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });

  if (order.payment_status !== 'paid') {
    const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';
    const msg =
      `🔔 *KLAIM PEMBAYARAN QRIS* — ${merchant}\n` +
      `Bill #${order.order_no} · Meja ${order.table_number}\n` +
      `Nominal: ${rupiahWA(order.total)}\n` +
      `Pelanggan klaim sudah bayar. Mohon cek mutasi di app BCA sebelum tekan "Tandai Lunas" di Kasir.`;
    sendNotif(msg);
  }

  return NextResponse.json({ ok: true, order });
}
