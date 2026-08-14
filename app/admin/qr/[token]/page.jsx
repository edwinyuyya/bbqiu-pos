import QRCode from 'qrcode';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { getBaseUrl } from '../../../../lib/baseUrl';
import QrLabelStyle from '../../../components/QrLabelStyle';
import QrPrintButton from './QrPrintButton';

export const dynamic = 'force-dynamic';

export default async function QrCardPage({ params }) {
  const { token } = await params;
  const db = supabaseServer();

  const { data: table } = await db
    .from('tables')
    .select('table_number, token, area')
    .eq('token', token)
    .single();

  if (!table) {
    return <div className="container-sm" style={{ paddingTop: 40 }}><div className="card">Meja tidak ditemukan.</div></div>;
  }

  const base = await getBaseUrl();
  const link = `${base}/meja/${table.token}`;
  const dataUrl = await QRCode.toDataURL(link, { width: 600, margin: 1 });
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <QrLabelStyle />
      <QrPrintButton />
      <div className="qr-label">
        <div className="merchant">{merchant}</div>
        <div className="meja">MEJA {table.table_number}</div>
        {table.area && <div className="hint" style={{ margin: '1mm 0 0' }}>{table.area}</div>}
        <div className="hint">Scan untuk panggil waiter &amp; lihat pesanan</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`QR meja ${table.table_number}`} />
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
