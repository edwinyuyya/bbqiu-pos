import { supabaseServer } from '../../../lib/supabaseServer';
import PrintNota from './PrintNota';
import BbqiuLogoMark from '../../components/BbqiuLogoMark';
import { taxPercent } from '../../../lib/tax';
import { variantSuffix } from '../../../lib/variants';

export const dynamic = 'force-dynamic';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function fmt(ts) {
  return new Date(ts).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function NotaPage({ params }) {
  const { orderId } = await params;
  const db = supabaseServer();
  const { data: order } = await db.from('orders').select('*').eq('id', orderId).single();
  if (!order) {
    return <div className="container-sm" style={{ paddingTop: 40 }}><div className="card">Order tidak ditemukan.</div></div>;
  }
  const { data: items } = await db
    .from('order_items').select('*').eq('order_id', orderId)
    // item yang dibatalkan tidak ikut ditagihkan ke pelanggan
    .is('cancelled_at', null)
    .order('created_at', { ascending: true });

  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'BBQIU';
  const paid = order.payment_status === 'paid';
  const method = order.payment_method === 'qris' ? 'QRIS' : 'Kasir';

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <PrintNota
        order={order}
        items={items || []}
        merchant={merchant}
        persenPajak={taxPercent()}
      />
      <div className="ticket">
        <BbqiuLogoMark width={150} />
        <div className="ctr small" style={{ marginTop: 2 }}>SOLO</div>
        <div className="line" />
        <div className="item"><span>No. Order</span><span>#{order.order_no}</span></div>
        <div className="item"><span>Meja</span><span>{order.table_number}</span></div>
        <div className="item"><span>Waktu</span><span>{fmt(order.created_at)}</span></div>
        {order.customer_name && <div className="item"><span>Nama</span><span>{order.customer_name}</span></div>}
        <div className="line" />
        {(items || []).map((it) => (
          <div key={it.id} style={{ marginBottom: 3 }}>
            <div>{it.name}{variantSuffix(it)}</div>
            <div className="item">
              <span>{it.qty} x {rupiah(it.price)}</span>
              <span className="rgt">{rupiah(it.qty * it.price)}</span>
            </div>
            {/* Potongan ditulis di barisnya sendiri. Tanpa ini nota cuma
                memuat satu angka diskon di bawah, dan tamu wajar mengira
                seluruh isi nota — termasuk minuman — ikut dipotong. */}
            {Number(it.discount) > 0 && (
              <div className="item">
                <span>&nbsp;&nbsp;Diskon {it.discount_note || ''}</span>
                <span className="rgt">- {rupiah(it.discount)}</span>
              </div>
            )}
            {it.note && <div style={{ fontStyle: 'italic' }}>* {it.note}</div>}
          </div>
        ))}
        <div className="line" />
        <div className="item"><span>Subtotal</span><span className="rgt">{rupiah(order.subtotal)}</span></div>
        {Number(order.discount) > 0 && (
          <div className="item">
            <span>Diskon{order.promo_code ? ` (${order.promo_code})` : ''}</span>
            <span className="rgt">- {rupiah(order.discount)}</span>
          </div>
        )}
        {Number(order.tax) > 0 && (
          <div className="item"><span>PB1 {taxPercent()}%</span><span className="rgt">{rupiah(order.tax)}</span></div>
        )}
        <div className="item" style={{ fontWeight: 800, fontSize: 14, marginTop: 2 }}>
          <span>TOTAL</span><span className="rgt">{rupiah(order.total)}</span>
        </div>
        <div className="line" />
        <div className="item"><span>Bayar</span><span>{method}</span></div>
        <div className="item"><span>Status</span><span>{paid ? 'LUNAS' : 'BELUM BAYAR'}</span></div>
        <div className="line" />
        <div className="ctr" style={{ marginTop: 4 }}>Terima kasih 🙏</div>
        <div className="ctr small">Selamat menikmati!</div>
        <div className="ctr small" style={{ marginTop: 6, color: '#666' }}>— Nexora POS —</div>
      </div>
    </div>
  );
}
