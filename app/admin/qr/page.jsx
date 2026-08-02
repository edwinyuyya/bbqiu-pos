import QRCode from 'qrcode';
import { supabaseServer } from '../../../lib/supabaseServer';
import { getBaseUrl } from '../../../lib/baseUrl';
import QrPrintButton from './[token]/QrPrintButton';

export const dynamic = 'force-dynamic';

// Cetak QR semua meja sekaligus (1 label per meja, page-break otomatis
// per label) — supaya tidak perlu buka satu-satu dari Kelola Meja.
export default async function QrAllPage() {
  const db = supabaseServer();
  const { data: tables } = await db
    .from('tables')
    .select('table_number, token, area, active')
    .eq('active', true)
    .order('area', { ascending: true })
    .order('table_number', { ascending: true });

  const base = await getBaseUrl();
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';

  const labels = await Promise.all(
    (tables || []).map(async (t) => ({
      table_number: t.table_number,
      area: t.area,
      qr: await QRCode.toDataURL(`${base}/menu/${t.token}`, { width: 360, margin: 1 }),
      link: `${base}/menu/${t.token}`,
    }))
  );

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <QrPrintButton />
      <p className="muted small no-print" style={{ marginBottom: 12 }}>
        {labels.length} label QR meja — tiap meja jadi 1 halaman/potongan cetak terpisah.
      </p>
      {labels.map((l, i) => (
        <div key={i} className="ticket" style={{ width: 320, padding: 20, fontFamily: 'system-ui, sans-serif' }}>
          <h3 style={{ fontSize: 18 }}>{merchant}</h3>
          <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
            MEJA {l.table_number}
          </div>
          {l.area && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: -4 }}>{l.area}</div>
          )}
          <div style={{ textAlign: 'center', margin: '8px 0' }}>Scan untuk lihat menu &amp; pesan</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.qr} alt={`QR meja ${l.table_number}`} style={{ width: 280, height: 280, display: 'block', margin: '0 auto' }} />
          <div style={{ textAlign: 'center', fontSize: 11, marginTop: 8, wordBreak: 'break-all' }}>{l.link}</div>
        </div>
      ))}
      {labels.length === 0 && (
        <div className="card no-print"><p className="muted" style={{ margin: 0 }}>Belum ada meja aktif.</p></div>
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
