import QRCode from 'qrcode';
import { supabaseServer } from '../../../lib/supabaseServer';
import { getBaseUrl } from '../../../lib/baseUrl';
import { bandingNomorMeja } from '../../../lib/urutMeja';
import QrLabelStyle from '../../components/QrLabelStyle';
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
    .order('area', { ascending: true });

  // Urutan nomor meja dirapikan di sini, bukan di query: Postgres mengurutkan
  // teks huruf per huruf sehingga "AC 10" muncul tepat sesudah "AC 1".
  // Area tetap jadi kunci pertama supaya label tercetak berkelompok.
  const urut = [...(tables || [])].sort(
    (a, b) => (a.area || '').localeCompare(b.area || '', 'id')
      || bandingNomorMeja(a.table_number, b.table_number),
  );

  const base = await getBaseUrl();
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';

  const labels = await Promise.all(
    urut.map(async (t) => ({
      table_number: t.table_number,
      area: t.area,
      qr: await QRCode.toDataURL(`${base}/meja/${t.token}`, { width: 600, margin: 1 }),
      link: `${base}/meja/${t.token}`,
    }))
  );

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <QrLabelStyle />
      <QrPrintButton />
      <p className="muted small no-print" style={{ marginBottom: 12 }}>
        {labels.length} label QR meja — tiap meja jadi 1 halaman/potongan cetak terpisah.
      </p>
      {labels.map((l, i) => (
        <div key={i} className="qr-label">
          <div className="merchant">{merchant}</div>
          <div className="meja">MEJA {l.table_number}</div>
          {l.area && <div className="hint" style={{ margin: '1mm 0 0' }}>{l.area}</div>}
          <div className="hint">Scan untuk panggil waiter &amp; lihat pesanan</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.qr} alt={`QR meja ${l.table_number}`} />
          <div className="link">{l.link}</div>
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
