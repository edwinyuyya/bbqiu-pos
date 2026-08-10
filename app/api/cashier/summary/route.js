import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { ORDER_TERJADWAL } from '../../../../lib/reservation';

export const dynamic = 'force-dynamic';

// Awal & akhir hari menurut WIB, dikirim sebagai ISO UTC.
// Tanpa ini, "hari ini" akan berganti pukul 07:00 pagi (pergantian hari UTC)
// dan omzet malam hari masuk ke tanggal berikutnya.
function rentangWIB(dariTgl, sampaiTgl) {
  const mulai = new Date(`${dariTgl}T00:00:00+07:00`).toISOString();
  const akhir = new Date(`${sampaiTgl}T23:59:59.999+07:00`).toISOString();
  return { mulai, akhir };
}

function hariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

// Jumlah hari dalam rentang (inklusif) — dipakai mengalikan biaya tetap harian.
function jumlahHari(dari, sampai) {
  const a = new Date(`${dari}T00:00:00Z`);
  const b = new Date(`${sampai}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// GET /api/cashier/summary?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
//
// Ringkasan untuk KASIR: omzet, rincian cara bayar, pengeluaran operasional,
// dan beban biaya tetap. Sengaja TIDAK memuat HPP, margin, atau laba — itu
// wilayah dashboard Owner.
export async function GET(req) {
  const db = supabaseServer();
  const sp = new URL(req.url).searchParams;
  const dari = sp.get('dari') || hariIniWIB();
  const sampai = sp.get('sampai') || dari;
  const { mulai, akhir } = rentangWIB(dari, sampai);

  const [ordersRes, pettyRes, fixedRes, setRes] = await Promise.all([
    db.from('orders')
      .select('id, order_no, table_number, status, payment_method, payment_status, total, created_at')
      .gte('created_at', mulai).lte('created_at', akhir)
      .neq('status', ORDER_TERJADWAL),
    db.from('petty_cash')
      .select('id, type, amount, note, category, created_by, created_at')
      .gte('created_at', mulai).lte('created_at', akhir)
      .order('created_at', { ascending: false }),
    db.from('fixed_costs').select('amount_monthly').eq('active', true),
    db.from('settings').select('value').eq('key', 'hari_buka_per_bulan').maybeSingle(),
  ]);

  const orders = ordersRes.data || [];
  const hidup = orders.filter((o) => o.status !== 'cancelled');
  const lunas = hidup.filter((o) => o.payment_status === 'paid');
  const belum = hidup.filter((o) => o.payment_status !== 'paid');
  const batal = orders.filter((o) => o.status === 'cancelled');

  const jml = (arr) => arr.reduce((s, o) => s + Number(o.total || 0), 0);
  const perCara = (metode) => {
    const rows = lunas.filter((o) => o.payment_method === metode);
    return { jumlah: rows.length, nilai: jml(rows) };
  };

  // --- pengeluaran ---
  const petty = pettyRes.data || [];
  const keluar = petty.filter((p) => p.type === 'out');
  const masuk = petty.filter((p) => p.type === 'in');
  const totalKeluar = keluar.reduce((s, p) => s + Number(p.amount || 0), 0);

  const perKategori = {};
  for (const p of keluar) {
    const k = p.category || 'Lainnya';
    perKategori[k] = (perKategori[k] || 0) + Number(p.amount || 0);
  }

  // --- biaya tetap ---
  const totalBulanan = (fixedRes.data || []).reduce((s, f) => s + Number(f.amount_monthly || 0), 0);
  const hariBuka = Math.max(1, Number(setRes.data?.value) || 30);
  const fixedPerHari = Math.round(totalBulanan / hariBuka);
  const hari = jumlahHari(dari, sampai);
  const fixedRentang = fixedPerHari * hari;

  const omzet = jml(lunas);
  const totalBiaya = totalKeluar + fixedRentang;

  return NextResponse.json({
    dari, sampai, hari,
    omzet,
    order_lunas: lunas.length,
    belum_bayar: { jumlah: belum.length, nilai: jml(belum) },
    batal: { jumlah: batal.length, nilai: jml(batal) },
    cara_bayar: { qris: perCara('qris'), cashier: perCara('cashier') },
    pengeluaran: {
      total: totalKeluar,
      per_kategori: perKategori,
      isi_kas: masuk.reduce((s, p) => s + Number(p.amount || 0), 0),
      rincian: keluar.slice(0, 50),
    },
    biaya_tetap: {
      total_bulanan: totalBulanan,
      hari_buka_per_bulan: hariBuka,
      per_hari: fixedPerHari,
      rentang: fixedRentang,
    },
    total_biaya: totalBiaya,
    sisa: omzet - totalBiaya,
  });
}
