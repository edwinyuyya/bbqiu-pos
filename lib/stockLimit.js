// Sisa porsi yang masih bisa dibuat dari stok bahan riil (resep qty vs stock_qty).
// Dipakai menu pelanggan (server) dan halaman waiter (client) — satu rumus saja
// supaya angkanya tidak pernah beda antar layar.

// recipeRows: baris recipe_items + join inventory_items(stock_qty)
export function stockLimitByMenu(recipeRows) {
  const byMenu = {};
  for (const r of recipeRows || []) {
    const need = Number(r.qty);
    if (!need || need <= 0) continue;
    const canMake = Math.floor(Number(r.inventory_items?.stock_qty || 0) / need);
    const cur = byMenu[r.menu_item_id];
    byMenu[r.menu_item_id] = cur === undefined ? canMake : Math.min(cur, canMake);
  }
  return byMenu;
}

export function attachStockLimit(items, byMenu) {
  return (items || []).map((i) => ({
    ...i,
    stock_limit: byMenu[i.id] !== undefined ? byMenu[i.id] : null,
  }));
}
