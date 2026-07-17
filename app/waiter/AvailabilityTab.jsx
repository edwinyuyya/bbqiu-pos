'use client';

import { supabase } from '../../lib/supabase';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

// Khusus Waiter: HANYA tandai menu habis/tersedia. Tidak ada edit nama/harga,
// tidak ada foto, tidak ada Resep/HPP/bahan — sengaja disembunyikan total.
export default function AvailabilityTab({ items, reload }) {
  async function toggle(it) {
    await supabase.from('menu_items').update({ available: !it.available }).eq('id', it.id);
    reload();
  }

  return (
    <div className="col">
      <p className="muted small">Tandai menu yang sedang habis/kosong. Harga & resep dikelola oleh Admin.</p>
      {items.map((it) => (
        <div key={it.id} className="card">
          <div className="between">
            <div>
              <span className="bold">{it.name}</span> · {rupiah(it.price)}
            </div>
            <span className={`badge ${it.available ? 'badge-green' : 'badge-red'}`}>{it.available ? 'Tersedia' : 'Habis'}</span>
          </div>
          <button
            className="btn btn-block"
            style={{ marginTop: 10 }}
            onClick={() => toggle(it)}
          >
            {it.available ? 'Tandai Habis' : 'Tandai Tersedia'}
          </button>
        </div>
      ))}
      {items.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada menu.</p></div>}
    </div>
  );
}
