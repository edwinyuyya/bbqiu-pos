import { supabaseServer } from '../../../../lib/supabaseServer';
import PrintControls from './PrintControls';
import BbqiuLogoMark from '../../../components/BbqiuLogoMark';
import { variantLabels } from '../../../../lib/variants';
import { STATIONS as STATION_LIST, perKelompokDapur } from '../../../../lib/stations';
import { WAJIB_BAYAR_DULU, PESAN_MENUNGGU_BAYAR } from '../../../../lib/orderFlow';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATIONS = STATION_LIST.map((s) => ({ id: s.id, name: s.cetak }));

function fmtTime(ts) {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default async function PrintPage({ params, searchParams }) {
  const { orderId } = await params;
  const db = supabaseServer();

  const { data: order } = await db.from('orders').select('*').eq('id', orderId).single();
  if (!order) {
    return <div className="container-sm" style={{ paddingTop: 40 }}><div className="card">Order tidak ditemukan.</div></div>;
  }

  // Struk station adalah perintah memasak. Kalau bill belum lunas, jangan
  // dicetak sama sekali — sekali struk keluar, makanan akan terlanjur dibuat.
  if (WAJIB_BAYAR_DULU && order.payment_status !== 'paid' && !order.kitchen_released) {
    return (
      <div className="container-sm" style={{ paddingTop: 40 }}>
        <div className="card" style={{ borderColor: 'var(--red)' }}>
          <div className="h2">Belum bisa dicetak</div>
          <p style={{ marginTop: 8 }}>
            Pesanan <b>#{order.order_no}</b> (Meja {order.table_number}) belum lunas.
          </p>
          <p className="muted small">{PESAN_MENUNGGU_BAYAR}</p>
          <p className="muted small">
            Tandai lunas dulu di halaman Kasir, lalu struk ini bisa dicetak.
          </p>
          <Link href="/cashier" className="btn btn-brand btn-block" style={{ marginTop: 10 }}>
            Buka Kasir
          </Link>
        </div>
      </div>
    );
  }

  const { data: jobs } = await db
    .from('print_jobs')
    .select('id, batch_no')
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);
  const jobId = jobs?.[0]?.id || null;

  // Pesanan tambahan dari meja yang sama menempel ke bill ini sebagai
  // gelombang (batch) berikutnya. Struk hanya memuat gelombang yang belum
  // dicetak — kalau semua item ikut tercetak lagi, dapur akan memasak ulang
  // pesanan yang tadi sudah jadi.
  // ?semua=1 memaksa cetak seluruh isi bill (untuk cetak ulang manual).
  const { semua } = await searchParams;
  const cetakSemua = semua === '1' || jobs?.[0]?.batch_no == null;
  const batchCetak = jobs?.[0]?.batch_no ?? null;

  let q = db
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .is('cancelled_at', null);   // item batal tidak perlu dimasak
  if (!cetakSemua) q = q.eq('batch_no', batchCetak);
  const { data: items } = await q.order('created_at', { ascending: true });

  // Kelompokkan item per station (routing cetak)
  const grouped = STATIONS.map((s) => ({
    ...s,
    items: (items || []).filter((i) => i.station_id === s.id),
  }));
  const others = (items || []).filter((i) => !STATIONS.some((s) => s.id === i.station_id));
  if (others.length) grouped.push({ id: 'other', name: 'LAINNYA', items: others });

  const activeStations = grouped.filter((g) => g.items.length);

  const statusBayar = order.payment_status === 'paid'
    ? 'LUNAS'
    : order.kitchen_released
      ? 'DP (RESERVASI)'
      : (order.payment_method === 'qris' ? 'QRIS' : 'KASIR');

  // Bentuk yang sama dipakai untuk tampilan layar dan untuk perintah ESC/POS,
  // supaya struk termal tidak pernah beda isi dengan yang terlihat di layar.
  const untukTermal = activeStations.map((s) => ({
    nama: s.name,
    batchNo: cetakSemua ? null : batchCetak,
    statusBayar,
    kelompok: perKelompokDapur(s.items).map((g) => [g.kat, g.items]),
  }));

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <PrintControls jobId={jobId} order={order} stations={untukTermal} />

      <p className="muted small no-print" style={{ marginTop: 8 }}>
        Satu dokumen ini berisi {activeStations.length} struk station — printer akan
        mencetak berurutan dengan pemisah potong di antaranya.
        {!cetakSemua && (
          <>
            {' '}Yang dicetak hanya <b>pesanan tambahan ke-{batchCetak}</b>.{' '}
            <a href={`/kitchen/print/${orderId}?semua=1`}>Cetak seluruh isi bill</a>
          </>
        )}
      </p>

      {activeStations.map((s, idx) => (
        <div key={s.id}>
          <div className="ticket">
            <BbqiuLogoMark width={120} withTagline={false} />
            <h3 style={{ fontSize: 16, marginTop: 4 }}>{s.name}</h3>
            <div className="line" />
            <div className="item"><span>Order</span><span>#{order.order_no}</span></div>
            <div className="item"><span>Meja</span><span>{order.table_number}</span></div>
            {!cetakSemua && batchCetak > 1 && (
              <div className="item">
                <span><b>PESANAN TAMBAHAN</b></span><span><b>ke-{batchCetak}</b></span>
              </div>
            )}
            <div className="item"><span>Waktu</span><span>{fmtTime(order.created_at)}</span></div>
            <div className="item">
              <span>Bayar</span>
              <span>
                {order.payment_status === 'paid'
                  ? 'LUNAS'
                  : order.kitchen_released
                    ? 'DP (RESERVASI)'
                    : (order.payment_method === 'qris' ? 'QRIS' : 'KASIR')}
              </span>
            </div>
            <div className="line" />
            {perKelompokDapur(s.items).map((g) => (
              <div key={g.kat} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>» {g.kat}</div>
                {g.items.map((it) => (
                  <div key={it.id} style={{ marginBottom: 4 }}>
                    <div className="item">
                      <span>
                        <b>{it.qty}x</b> {it.name}
                        {variantLabels(it, { emoji: false }).map((lab) => (
                          <b key={lab}> [{lab.toUpperCase()}]</b>
                        ))}
                        {it.fry_first && <b> [GORENG DULU]</b>}
                      </span>
                    </div>
                    {it.note && <div style={{ fontStyle: 'italic', paddingLeft: 8 }}>* {it.note}</div>}
                  </div>
                ))}
              </div>
            ))}
            <div className="line" />
            {order.note && <div>Catatan order: {order.note}</div>}
            <div style={{ textAlign: 'center', marginTop: 6 }}>--- {s.name} ---</div>
          </div>
          {idx < activeStations.length - 1 && (
            <div className="cut no-print">✂ — — — — potong — — — — ✂</div>
          )}
        </div>
      ))}

      {activeStations.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Tidak ada item untuk dicetak.</p></div>
      )}
    </div>
  );
}
