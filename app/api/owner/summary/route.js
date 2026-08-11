import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { STATION_IDS } from '../../../../lib/stations';
import { ORDER_TERJADWAL } from '../../../../lib/reservation';

export const dynamic = 'force-dynamic';

// Awal hari WIB (UTC+7) dalam ISO
function startOfTodayWIB(offsetDays = 0) {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 3600 * 1000);
  const y = wib.getUTCFullYear(), m = wib.getUTCMonth(), d = wib.getUTCDate() - offsetDays;
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - 7 * 3600 * 1000).toISOString();
}

// GET /api/owner/summary?range=today|7d
export async function GET(req) {
  const db = supabaseServer();
  const range = new URL(req.url).searchParams.get('range') || 'today';
  const startISO = startOfTodayWIB(range === '7d' ? 6 : 0);

  const { data: orders } = await db
    .from('orders')
    .select('id, order_no, table_number, status, payment_method, payment_status, total, created_at, cancelled_at, void_reason, voided_by, void_photo')
    .gte('created_at', startISO)
    // Pra-pesanan reservasi ('scheduled') belum terjadi: tamunya belum datang,
    // makanannya belum dibuat, stoknya belum terpotong. Kalau ikut terhitung,
    // jumlah order & HPP hari ini jadi menggelembung oleh sesuatu yang belum
    // tentu jadi.
    .neq('status', ORDER_TERJADWAL);

  const live = (orders || []).filter((o) => o.status !== 'cancelled');

  // Void / pembatalan (titik rawan kebocoran -> dipantau owner)
  const cancelled = (orders || []).filter((o) => o.status === 'cancelled');
  const voids = {
    count: cancelled.length,
    value: cancelled.reduce((s, o) => s + Number(o.total || 0), 0),
    paid_count: cancelled.filter((o) => o.payment_status === 'paid').length,
    list: cancelled
      .sort((a, b) => new Date(b.cancelled_at || b.created_at) - new Date(a.cancelled_at || a.created_at))
      .slice(0, 30)
      .map((o) => ({
        order_no: o.order_no,
        table_number: o.table_number,
        total: Number(o.total || 0),
        was_paid: o.payment_status === 'paid',
        void_reason: o.void_reason || null,
        voided_by: o.voided_by || null,
        photo: o.void_photo || null,
        at: o.cancelled_at || o.created_at,
      })),
  };
  const paid = live.filter((o) => o.payment_status === 'paid');
  const revenuePaid = paid.reduce((s, o) => s + Number(o.total || 0), 0);
  const revenueAll = live.reduce((s, o) => s + Number(o.total || 0), 0);

  const pay = { qris: 0, cashier: 0, qris_count: 0, cashier_count: 0 };
  paid.forEach((o) => {
    if (o.payment_method === 'qris') { pay.qris += Number(o.total || 0); pay.qris_count++; }
    else { pay.cashier += Number(o.total || 0); pay.cashier_count++; }
  });

  // item terjual (per station + terlaris) + HPP (fluktuatif, harga beli terkini)
  const ids = live.map((o) => o.id);
  let perStation = Object.fromEntries(STATION_IDS.map((id) => [id, 0]));
  let topItems = [];
  let hppTotal = 0;
  if (ids.length) {
    const { data: its } = await db
      .from('order_items')
      .select('name, qty, price, station_id, order_id, menu_item_id')
      .in('order_id', ids);
    const byName = {};
    const qtyByMenu = {};
    (its || []).forEach((it) => {
      const val = Number(it.price) * Number(it.qty);
      if (it.station_id && perStation[it.station_id] !== undefined) perStation[it.station_id] += val;
      const k = it.name;
      byName[k] = byName[k] || { name: k, qty: 0, value: 0 };
      byName[k].qty += Number(it.qty);
      byName[k].value += val;
      if (it.menu_item_id) qtyByMenu[it.menu_item_id] = (qtyByMenu[it.menu_item_id] || 0) + Number(it.qty);
    });
    topItems = Object.values(byName).sort((a, b) => b.qty - a.qty).slice(0, 8);

    // HPP: Σ (qty terjual × biaya resep per porsi, dihitung dari harga beli TERKINI tiap bahan)
    const menuIds = Object.keys(qtyByMenu);
    if (menuIds.length) {
      const { data: recipeRows } = await db
        .from('recipe_items')
        .select('menu_item_id, qty, inventory_items(cost_price)')
        .in('menu_item_id', menuIds);
      const costPerPortion = {};
      (recipeRows || []).forEach((r) => {
        const c = Number(r.qty) * Number(r.inventory_items?.cost_price || 0);
        costPerPortion[r.menu_item_id] = (costPerPortion[r.menu_item_id] || 0) + c;
      });
      hppTotal = menuIds.reduce((s, mid) => s + (costPerPortion[mid] || 0) * qtyByMenu[mid], 0);
    }
  }
  const grossMargin = revenueAll - hppTotal;

  // belanja hari ini (nilai 'in')
  const { data: moves } = await db
    .from('stock_movements')
    .select('cost, type, created_at')
    .gte('created_at', startISO)
    .eq('type', 'in');
  const purchaseValue = (moves || []).reduce((s, m) => s + Number(m.cost || 0), 0);

  // penutupan kasir / akhir shift (dengan foto wajah)
  const { data: closuresRaw } = await db
    .from('cashier_closures')
    .select('id, closed_by, cash_total, note, photo, created_at')
    .gte('created_at', startISO)
    .order('created_at', { ascending: false })
    .limit(30);
  const closures = (closuresRaw || []).map((c) => ({
    closed_by: c.closed_by,
    cash_total: c.cash_total,
    note: c.note,
    photo: c.photo || null,
    at: c.created_at,
  }));

  // kerugian rusak/susut (waste) — terpisah dari pemakaian resep normal
  const { data: wasteRaw } = await db
    .from('stock_movements')
    .select('qty, note, created_at, inventory_items(name, unit, cost_price)')
    .gte('created_at', startISO)
    .eq('type', 'waste')
    .order('created_at', { ascending: false })
    .limit(50);
  const wasteList = wasteRaw || [];
  const wasteValue = wasteList.reduce((s, w) => s + Number(w.qty) * Number(w.inventory_items?.cost_price || 0), 0);
  const waste = {
    count: wasteList.length,
    value: wasteValue,
    list: wasteList.slice(0, 20).map((w) => ({
      name: w.inventory_items?.name || '-',
      qty: Number(w.qty),
      unit: w.inventory_items?.unit || '',
      value: Number(w.qty) * Number(w.inventory_items?.cost_price || 0),
      note: w.note,
      at: w.created_at,
    })),
  };

  // Susut produksi (serpihan potong). Dipisah dari waste karena sifatnya beda:
  // serpihan itu biaya wajar yang selalu ada, sedangkan waste adalah barang
  // rusak. Kalau digabung, laporan barang rusak berhenti berarti "ada yang
  // ceroboh" dan orang berhenti memperhatikannya.
  const { data: susutRaw } = await db
    .from('stock_movements')
    .select('qty, note, created_at, inventory_items(name, unit, cost_price)')
    .gte('created_at', startISO)
    .eq('type', 'susut_produksi')
    .order('created_at', { ascending: false })
    .limit(50);
  const susutList = susutRaw || [];
  const susutProduksi = {
    count: susutList.length,
    value: susutList.reduce((s, w) => s + Number(w.qty) * Number(w.inventory_items?.cost_price || 0), 0),
    list: susutList.slice(0, 15).map((w) => ({
      name: w.inventory_items?.name || '-',
      qty: Number(w.qty),
      unit: w.inventory_items?.unit || '',
      value: Number(w.qty) * Number(w.inventory_items?.cost_price || 0),
      note: w.note,
      at: w.created_at,
    })),
  };

  // kinerja dapur (durasi order masuk -> diklik selesai)
  const { data: perfRaw } = await db
    .from('kitchen_perf_log')
    .select('order_no, table_number, duration_sec, item_count, completed_at')
    .gte('completed_at', startISO)
    .order('completed_at', { ascending: false });
  const perfList = perfRaw || [];
  const avgDurationSec = perfList.length
    ? Math.round(perfList.reduce((s, p) => s + Number(p.duration_sec), 0) / perfList.length)
    : 0;
  const slowest = [...perfList].sort((a, b) => b.duration_sec - a.duration_sec).slice(0, 5);
  const kitchenPerf = {
    count: perfList.length,
    avg_duration_sec: avgDurationSec,
    slowest: slowest.map((p) => ({
      order_no: p.order_no,
      table_number: p.table_number,
      duration_sec: p.duration_sec,
      item_count: p.item_count,
      at: p.completed_at,
    })),
  };

  // stok menipis
  const { data: inv } = await db
    .from('inventory_items')
    .select('id, name, unit, stock_qty, min_stock')
    .order('name');
  const lowStock = (inv || []).filter((i) => Number(i.stock_qty) <= Number(i.min_stock));

  return NextResponse.json({
    range,
    orders_count: live.length,
    paid_count: paid.length,
    unpaid_count: live.length - paid.length,
    revenue_paid: revenuePaid,
    revenue_all: revenueAll,
    avg_order: live.length ? Math.round(revenueAll / live.length) : 0,
    payment: pay,
    per_station: perStation,
    top_items: topItems,
    hpp_total: hppTotal,
    gross_margin: grossMargin,
    purchase_value: purchaseValue,
    low_stock: lowStock,
    inventory_count: (inv || []).length,
    voids,
    closures,
    kitchen_perf: kitchenPerf,
    waste,
    susut_produksi: susutProduksi,
  });
}
