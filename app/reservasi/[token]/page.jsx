import { supabaseServer } from '../../../lib/supabaseServer';
import { taxPercent } from '../../../lib/tax';
import { stockLimitByMenu, attachStockLimit } from '../../../lib/stockLimit';
import { STATUS, STATUS_LABEL, jamRapi, tanggalRapi } from '../../../lib/reservation';
import MenuClient from '../../menu/[token]/MenuClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Reservasi — BBQIU' };

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

export default async function ReservasiPage({ params }) {
  const { token } = await params;
  const db = supabaseServer();
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';

  const { data: resv } = await db
    .from('reservations')
    .select('*, tables(table_number, area)')
    .eq('token', token)
    .maybeSingle();

  if (!resv) {
    return (
      <div className="cust-page"><div className="container-sm" style={{ paddingTop: 40 }}>
        <div className="card">Reservasi tidak ditemukan. Hubungi kami untuk memastikan linknya benar.</div>
      </div></div>
    );
  }

  // Pra-pesanan yang sudah dibuat sebelumnya (kalau ada)
  const { data: praPesan } = await db
    .from('orders')
    .select('*')
    .eq('reservation_id', resv.id)
    .eq('status', 'scheduled')
    .maybeSingle();
  let praItems = [];
  if (praPesan) {
    const { data } = await db
      .from('order_items').select('*').eq('order_id', praPesan.id)
      .is('cancelled_at', null).order('created_at');
    praItems = data || [];
  }

  const dp = Number(resv.deposit_amount || 0);
  const total = Number(praPesan?.total || 0);
  const sisa = Math.max(0, total - dp);

  const header = (
    <>
      <div className="card">
        <div className="between">
          <div>
            <div className="muted small">Reservasi atas nama</div>
            <div className="bold" style={{ fontSize: 18 }}>{resv.customer_name}</div>
          </div>
          <span className={`badge ${resv.status === STATUS.BOOKED ? 'badge-green' : 'badge'}`}>
            {STATUS_LABEL[resv.status] || resv.status}
          </span>
        </div>
        <hr className="hr" />
        <div className="between"><span className="muted">Tanggal</span><span className="bold">{tanggalRapi(resv.reserved_date)}</span></div>
        {resv.reserved_time && (
          <div className="between" style={{ marginTop: 6 }}>
            <span className="muted">Jam</span><span className="bold">{jamRapi(resv.reserved_time)}</span>
          </div>
        )}
        <div className="between" style={{ marginTop: 6 }}>
          <span className="muted">Jumlah orang</span><span className="bold">{resv.party_size}</span>
        </div>
        <div className="between" style={{ marginTop: 6 }}>
          <span className="muted">Meja</span>
          <span className="bold">
            {resv.tables?.table_number ? `${resv.tables.table_number}${resv.tables.area ? ` · ${resv.tables.area}` : ''}` : 'Ditentukan saat datang'}
          </span>
        </div>
        {dp > 0 && (
          <div className="between" style={{ marginTop: 6, color: '#16794a' }}>
            <span>DP diterima</span><span className="bold">{rupiah(dp)}</span>
          </div>
        )}
        <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
          Meja dapat berubah menyesuaikan kondisi saat kedatangan. Kami akan
          menyiapkan meja untuk {resv.party_size} orang.
        </p>
      </div>

      {praPesan && praItems.length > 0 && (
        <div className="card">
          <div className="h2" style={{ marginBottom: 8 }}>Pra-pesanan Anda</div>
          {praItems.map((it) => (
            <div key={it.id} className="between small" style={{ marginBottom: 4 }}>
              <span>{it.qty}× {it.name}</span>
              <span>{rupiah(it.price * it.qty)}</span>
            </div>
          ))}
          <hr className="hr" />
          <div className="between"><span className="bold">Total</span><span className="bold">{rupiah(total)}</span></div>
          {dp > 0 && (
            <>
              <div className="between small" style={{ marginTop: 6 }}>
                <span className="muted">DP sudah dibayar</span><span>− {rupiah(dp)}</span>
              </div>
              <div className="between" style={{ marginTop: 6 }}>
                <span className="bold">Sisa dibayar saat datang</span>
                <span className="bold">{rupiah(sisa)}</span>
              </div>
            </>
          )}
          <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
            Pesanan ini belum diteruskan ke dapur. Masakan mulai dibuat setelah
            Anda tiba dan pelunasan diterima, supaya sampai di meja dalam
            keadaan hangat.
          </p>
        </div>
      )}
    </>
  );

  if (resv.status !== STATUS.BOOKED) {
    return (
      <div className="cust-page"><div className="container-sm" style={{ paddingBottom: 40 }}>
        <div className="brand-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/bbqiu-logo.png" alt="BBQIU" />
          <div className="brand-divider" />
        </div>
        <h1 className="title">Reservasi</h1>
        <div className="col" style={{ marginTop: 12 }}>{header}</div>
      </div></div>
    );
  }

  // Menu untuk pra-pesanan — sama persis dengan menu meja.
  const { data: categories } = await db
    .from('categories').select('id, name, station_id, sort_order').order('sort_order');
  const { data: items } = await db
    .from('menu_items')
    .select('id, category_id, name, description, price, station_id, image_url, daily_qty, available, needs_cook_method, needs_drink_option, sort_order')
    .eq('available', true)
    .order('sort_order');

  const menuIds = (items || []).map((i) => i.id);
  let byMenu = {};
  if (menuIds.length) {
    const { data: recipeRows } = await db
      .from('recipe_items')
      .select('menu_item_id, qty, inventory_items(stock_qty)')
      .in('menu_item_id', menuIds);
    byMenu = stockLimitByMenu(recipeRows);
  }

  return (
    <MenuClient
      token={token}
      table={{ id: resv.table_id, table_number: resv.tables?.table_number || '—' }}
      categories={categories || []}
      items={attachStockLimit(items, byMenu)}
      taxPercent={taxPercent()}
      merchant={merchant}
      mode="reservasi"
      headerExtra={header}
      judul={`Pra-pesan · ${resv.customer_name}`}
    />
  );
}
