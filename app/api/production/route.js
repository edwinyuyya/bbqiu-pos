import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET /api/production?output=<inventory_item_id>
// Dua hal sekaligus:
//   recipes -> bahan mentah apa saja yang terpakai untuk 1 satuan bahan ini
//   menus   -> menu apa saja yang memakai bahan ini, dan berapa per porsinya
//
// `menus` dipakai untuk menghitung mundur: dapur berpikir "produksi 5 porsi
// karubi small", bukan "produksi 150 gram". Stok tetap disimpan dalam gram
// karena satu bahan dipakai beberapa menu dengan takaran berbeda (karubi
// small 30 g, karubi biasa 100 g) — kalau stok disimpan per porsi, angkanya
// jadi ambigu porsi yang mana.
export async function GET(req) {
  const db = supabaseServer();
  const outputId = new URL(req.url).searchParams.get('output');
  if (!outputId) return NextResponse.json({ recipes: [], menus: [] });

  const [resep, pakai] = await Promise.all([
    db.from('production_recipes')
      .select('id, output_item_id, input_item_id, qty')
      .eq('output_item_id', outputId)
      .order('created_at'),
    db.from('recipe_items')
      .select('qty, menu_items(id, name, available)')
      .eq('inventory_item_id', outputId),
  ]);

  if (resep.error) return NextResponse.json({ error: 'Gagal membaca resep produksi' }, { status: 500 });

  const menus = (pakai.data || [])
    .filter((r) => r.menu_items && Number(r.qty) > 0)
    .map((r) => ({
      id: r.menu_items.id,
      name: r.menu_items.name,
      available: r.menu_items.available,
      per_porsi: Number(r.qty),
    }))
    .sort((a, b) => a.per_porsi - b.per_porsi || a.name.localeCompare(b.name));

  return NextResponse.json({ recipes: resep.data || [], menus });
}

// POST /api/production
//   { output_item_id, qty, note?, pakai?: {input_item_id: jumlah},
//     susut?: {input_item_id: jumlah} }
//
// Satu langkah untuk dua akibat: stok bahan jadi BERTAMBAH dan bahan
// mentahnya BERKURANG. Sebelumnya ini dua tindakan terpisah dan yang kedua
// hampir selalu terlewat saat sibuk — akibatnya daging tercatat dua kali,
// sekali sebagai gelondongan dan sekali sebagai potongan.
//
// `pakai` = jumlah bahan mentah yang BENAR-BENAR diambil dari stok. Kalau
// tidak diisi, dipakai perkiraan dari resep. Resep hanyalah perkiraan; berat
// gelondongan tidak pernah persis sama, jadi angka sungguhan harus bisa
// menimpanya kalau tidak stok selamanya meleset sedikit demi sedikit.
//
// `susut` = serpihan yang terbuang, dan itu BAGIAN DARI `pakai`, bukan
// tambahan. Dicatat terpisah supaya rendemen sungguhan bisa dihitung, tapi
// stoknya tidak dipotong dua kali.
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const outputId = b.output_item_id;
  const qty = Number(b.qty);
  if (!outputId) return NextResponse.json({ error: 'Bahan hasil produksi wajib dipilih' }, { status: 400 });
  if (!(qty > 0)) return NextResponse.json({ error: 'Jumlah hasil produksi wajib diisi' }, { status: 400 });
  const note = (b.note || '').toString().trim().slice(0, 200);
  const pakaiIsi = b.pakai && typeof b.pakai === 'object' ? b.pakai : {};
  const susutIsi = b.susut && typeof b.susut === 'object' ? b.susut : {};

  const { data: output } = await db
    .from('inventory_items').select('id, name, unit, stock_qty').eq('id', outputId).maybeSingle();
  if (!output) return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 });

  const { data: resep } = await db
    .from('production_recipes')
    .select('input_item_id, qty, inventory_items!production_recipes_input_item_id_fkey(id, name, unit, stock_qty)')
    .eq('output_item_id', outputId);

  const keterangan = `Produksi: ${qty} ${output.unit} ${output.name}${note ? ` — ${note}` : ''}`;

  // 1) Bahan jadi bertambah
  await db
    .from('inventory_items')
    .update({ stock_qty: Number(output.stock_qty || 0) + qty })
    .eq('id', outputId);
  await db.from('stock_movements').insert({
    item_id: outputId, type: 'in', qty, note: keterangan,
  });

  // 2) Bahan mentah berkurang.
  // Stok boleh minus — produksi yang sudah terjadi di dapur tidak boleh
  // ditolak sistem hanya karena catatannya belum lengkap. Angka minus jadi
  // penanda untuk diluruskan lewat opname.
  const dipakai = [];
  for (const r of resep || []) {
    const inv = r.inventory_items;
    if (!inv) continue;

    const perkiraan = Number(r.qty) * qty;
    const diisi = Number(pakaiIsi[inv.id]);
    const pakai = Number.isFinite(diisi) && diisi > 0 ? diisi : perkiraan;
    if (!(pakai > 0)) continue;

    const susut = Math.max(0, Math.min(pakai, Number(susutIsi[inv.id]) || 0));

    await db
      .from('inventory_items')
      .update({ stock_qty: Number(inv.stock_qty || 0) - pakai })
      .eq('id', inv.id);
    await db.from('stock_movements').insert({
      item_id: inv.id, type: 'out', qty: pakai,
      note: `Dipakai untuk ${keterangan}`,
    });

    // Jenis gerakan sendiri, bukan 'waste'. Serpihan potong itu biaya wajar
    // yang selalu ada; kalau dicampur ke laporan barang rusak, laporan itu
    // berhenti berarti "ada yang ceroboh" dan akan diabaikan orang.
    if (susut > 0) {
      await db.from('stock_movements').insert({
        item_id: inv.id, type: 'susut_produksi', qty: susut,
        note: `Serpihan dari ${keterangan} (sudah termasuk dalam ${pakai} ${inv.unit} yang dipakai)`,
      });
    }

    dipakai.push({
      id: inv.id, name: inv.name, unit: inv.unit,
      qty: pakai, perkiraan, susut,
    });
  }

  // Rendemen sungguhan dari sekali produksi ini. Dipakai staf gudang untuk
  // meluruskan takaran resep — inilah gunanya mencatat serpihan.
  let rendemen = null;
  if (dipakai.length === 1 && dipakai[0].unit === output.unit && dipakai[0].qty > 0) {
    const d = dipakai[0];
    rendemen = {
      bahan: d.name,
      dipakai: d.qty,
      hasil: qty,
      susut: d.susut,
      persen: Math.round((qty / d.qty) * 1000) / 10,
      // takaran resep = bahan mentah per 1 satuan hasil
      takaran_sebenarnya: Math.round((d.qty / qty) * 1000) / 1000,
    };
  }

  return NextResponse.json({ ok: true, output: output.name, qty, dipakai, rendemen });
}
