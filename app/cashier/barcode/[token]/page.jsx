import QRCode from 'qrcode';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { getBaseUrl } from '../../../../lib/baseUrl';
import QrLabelStyle from '../../../components/QrLabelStyle';
import QrPrintButton from '../../../admin/qr/[token]/QrPrintButton';

export const dynamic = 'force-dynamic';

const STATUS_HIDUP = ['open', 'preparing', 'served'];

// Barcode meja yang dicetak kasir lalu ditaruh di meja tamu.
//
// Kuncinya token MEJA, bukan id order, supaya bisa dicetak kapan saja —
// termasuk saat meja baru dipilih dan ordernya belum dibuat. Nomor pesanan
// diambil dari bill yang sedang jalan di meja itu kalau ada; kalau meja masih
// kosong, labelnya tetap sah, cuma tanpa nomor pesanan.
export default async function BarcodeMejaPage({ params }) {
  const { token } = await params;
  const db = supabaseServer();

  const { data: table } = await db
    .from('tables')
    .select('id, table_number, token, active')
    .eq('token', token)
    .single();

  if (!table) {
    return (
      <div className="container-sm" style={{ paddingTop: 40 }}>
        <div className="card">Meja tidak ditemukan.</div>
      </div>
    );
  }

  const { data: order } = await db
    .from('orders')
    .select('order_no, created_at')
    .eq('table_id', table.id)
    .in('status', STATUS_HIDUP)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = await getBaseUrl();
  const link = `${base}/meja/${table.token}`;
  const dataUrl = await QRCode.toDataURL(link, { width: 600, margin: 1 });
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <QrLabelStyle />
      <QrPrintButton label="🖨️ Cetak Barcode Meja" />
      <div className="qr-label">
        <div className="merchant">{merchant}</div>
        <div className="meja">MEJA {table.table_number}</div>
        {order && <div className="order">Pesanan #{order.order_no}</div>}
        <div className="hint">Scan untuk panggil waiter &amp; lihat pesanan</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`Barcode meja ${table.table_number}`} />
        <div className="link">{link}</div>
      </div>

      {!order && (
        <p className="muted small no-print" style={{ marginTop: 10 }}>
          Meja ini belum punya bill yang jalan, jadi labelnya tercetak tanpa nomor
          pesanan. Cetak lagi setelah ordernya dibuat kalau nomor pesanan perlu ikut
          tertulis.
        </p>
      )}
      {!base && (
        <p className="muted small no-print" style={{ marginTop: 10 }}>
          Catatan: <code>NEXT_PUBLIC_BASE_URL</code> belum diisi, jadi link QR memakai
          path relatif. Isi di environment untuk URL absolut yang bisa discan.
        </p>
      )}
    </div>
  );
}
