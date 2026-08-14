import QRCode from 'qrcode';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { getBaseUrl } from '../../../../lib/baseUrl';
import QrLabelStyle from '../../../components/QrLabelStyle';
import QrPrintButton from '../../../admin/qr/[token]/QrPrintButton';

export const dynamic = 'force-dynamic';

// Barcode meja yang dicetak kasir begitu order dibuat, lalu ditaruh di meja
// tamu. Isinya nomor meja dan nomor pesanan supaya staf bisa mencocokkan
// kertas di meja dengan bill di layar tanpa bertanya; QR-nya sendiri
// mengarah ke halaman meja (panggil waiter + lihat pesanan).
export default async function BarcodeMejaPage({ params }) {
  const { orderId } = await params;
  const db = supabaseServer();

  const { data: order } = await db
    .from('orders')
    .select('id, order_no, table_id, table_number, created_at')
    .eq('id', orderId)
    .single();

  if (!order) {
    return (
      <div className="container-sm" style={{ paddingTop: 40 }}>
        <div className="card">Order tidak ditemukan.</div>
      </div>
    );
  }

  const { data: table } = order.table_id
    ? await db.from('tables').select('table_number, token').eq('id', order.table_id).single()
    : { data: null };

  if (!table?.token) {
    return (
      <div className="container-sm" style={{ paddingTop: 40 }}>
        <div className="card">
          <p style={{ margin: 0 }}>
            Bill #{order.order_no} belum menempel ke meja mana pun, jadi barcode
            mejanya tidak bisa dibuat. Pindahkan bill ini ke sebuah meja dulu.
          </p>
        </div>
      </div>
    );
  }

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
        <div className="order">Pesanan #{order.order_no}</div>
        <div className="hint">Scan untuk panggil waiter &amp; lihat pesanan</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`Barcode meja ${table.table_number}`} />
        <div className="link">{link}</div>
      </div>
      {!base && (
        <p className="muted small no-print" style={{ marginTop: 10 }}>
          Catatan: <code>NEXT_PUBLIC_BASE_URL</code> belum diisi, jadi link QR memakai
          path relatif. Isi di environment untuk URL absolut yang bisa discan.
        </p>
      )}
    </div>
  );
}
