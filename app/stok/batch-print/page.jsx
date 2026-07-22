import QRCode from 'qrcode';
import { supabaseServer } from '../../../lib/supabaseServer';
import BbqiuLogoMark from '../../components/BbqiuLogoMark';
import BatchPrintClient from './BatchPrintClient';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
}

export default async function BatchPrintPage({ searchParams }) {
  const sp = await searchParams;
  const ids = (sp.ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!ids.length) {
    return <div className="container-sm" style={{ paddingTop: 40 }}><div className="card">Tidak ada batch dipilih.</div></div>;
  }

  const db = supabaseServer();
  const { data: batches } = await db
    .from('stock_batches')
    .select('id, batch_code, produced_date, qty_remaining, unit, inventory_items(name)')
    .in('id', ids);

  const labels = await Promise.all(
    (batches || []).map(async (b) => ({
      batch_code: b.batch_code,
      name: b.inventory_items?.name || '-',
      date: fmtDate(b.produced_date),
      qty: b.qty_remaining,
      unit: b.unit,
      qr: await QRCode.toDataURL(`BATCH:${b.batch_code}`, { width: 200, margin: 1 }),
    }))
  );

  return <BatchPrintClient labels={labels} logo={<BbqiuLogoMark width={110} withTagline={false} />} />;
}
