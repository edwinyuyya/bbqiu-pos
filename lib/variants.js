// Label pilihan varian item pesanan (cara masak & opsi minuman).
// Dipakai bersama oleh menu pelanggan, kasir, dapur, dan nota supaya
// istilahnya selalu sama di semua layar.

export const COOK_METHODS = [
  { id: 'grill', label: 'Grill', emoji: '🔥' },
  { id: 'steamboat', label: 'Steamboat', emoji: '🍲' },
];

export const DRINK_TEMPS = [
  { id: 'es', label: 'Es', emoji: '🧊' },
  { id: 'panas', label: 'Panas', emoji: '☕' },
];

export const SWEETNESS = [
  { id: 'mondo', label: 'Mondo' },
  { id: 'manis', label: 'Manis' },
  { id: 'tawar', label: 'Tawar' },
];

export const COOK_METHOD_IDS = COOK_METHODS.map((o) => o.id);
export const DRINK_TEMP_IDS = DRINK_TEMPS.map((o) => o.id);
export const SWEETNESS_IDS = SWEETNESS.map((o) => o.id);

// Kunci keranjang menyimpan semua pilihan varian sekaligus, supaya
// "Es Teh manis" dan "Es Teh tawar" jadi 2 baris pesanan terpisah.
// Dipakai menu pelanggan maupun input order kasir.
export function cartKey(itemId, { method = null, temp = null, sweet = null } = {}) {
  return [itemId, method || '', temp || '', sweet || ''].join('|');
}

export function parseCartKey(key) {
  const [menuId, method, temp, sweet] = key.split('|');
  return {
    menuId,
    method: method || null,
    temp: temp || null,
    sweet: sweet || null,
  };
}

function find(list, id) {
  return list.find((o) => o.id === id) || null;
}

export function cookMethodLabel(id, { emoji = true } = {}) {
  const o = find(COOK_METHODS, id);
  if (!o) return '';
  return emoji ? `${o.emoji} ${o.label}` : o.label;
}

export function drinkTempLabel(id, { emoji = true } = {}) {
  const o = find(DRINK_TEMPS, id);
  if (!o) return '';
  return emoji ? `${o.emoji} ${o.label}` : o.label;
}

export function sweetnessLabel(id) {
  const o = find(SWEETNESS, id);
  return o ? o.label : '';
}

// Semua varian sebuah baris pesanan jadi satu daftar label pendek,
// mis. ["🧊 Es", "Manis"] atau ["🔥 Grill"].
export function variantLabels(row, { emoji = true } = {}) {
  if (!row) return [];
  return [
    cookMethodLabel(row.cook_method, { emoji }),
    drinkTempLabel(row.drink_temp, { emoji }),
    sweetnessLabel(row.sweetness),
  ].filter(Boolean);
}

// Versi satu baris untuk struk/print, mis. "Es Teh (Es, Manis)".
export function variantSuffix(row) {
  const parts = variantLabels(row, { emoji: false });
  return parts.length ? ` (${parts.join(', ')})` : '';
}
