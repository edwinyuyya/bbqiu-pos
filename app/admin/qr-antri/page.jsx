import QRCode from 'qrcode';
import { getBaseUrl } from '../../../lib/baseUrl';
import QrPrintButton from '../qr/[token]/QrPrintButton';

export const dynamic = 'force-dynamic';

// Poster QR untuk dipasang di pintu masuk. Satu QR statis untuk semua
// pelanggan — beda dari QR meja yang punya token masing-masing.
export default async function QrAntriPage() {
  const base = await getBaseUrl();
  const link = `${base}/antri`;
  const dataUrl = await QRCode.toDataURL(link, { width: 420, margin: 1 });
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <QrPrintButton />
      <div
        className="ticket"
        style={{ width: 360, padding: 24, fontFamily: 'system-ui, sans-serif' }}
      >
        <h3 style={{ fontSize: 18 }}>{merchant}</h3>
        <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, margin: '6px 0' }}>
          ANTRIAN MEJA
        </div>
        <div style={{ textAlign: 'center', margin: '10px 0', fontSize: 15 }}>
          Meja penuh? Scan di sini untuk ambil nomor antrian.
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="QR antrian" style={{ width: 300, height: 300, display: 'block', margin: '0 auto' }} />
        <div style={{ textAlign: 'center', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
          Tidak perlu menunggu berdiri di depan.<br />
          Status antrian bisa dipantau dari HP Anda.
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, marginTop: 8, wordBreak: 'break-all' }}>{link}</div>
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
