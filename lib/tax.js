// PB1 (Pajak Barang & Jasa Tertentu / pajak restoran) — default 10%.
// Sengaja default 10 (bukan 0) supaya tetap kena walau env var lupa diisi;
// bisa dioverride lewat NEXT_PUBLIC_TAX_PERCENT kalau daerah lain beda tarif.
export const TAX_LABEL = 'PB1';

export function taxPercent() {
  const raw = process.env.NEXT_PUBLIC_TAX_PERCENT;
  if (raw === undefined || raw === '') return 10;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 10;
}
