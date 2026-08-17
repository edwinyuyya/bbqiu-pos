'use client';

import { useMemo, useState } from 'react';
import { MENU, rupiah } from '../../../lib/situs';

export default function MenuSitus() {
  const [aktif, setAktif] = useState('semua');
  const [cari, setCari] = useState('');

  const kategori = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return MENU
      .filter((k) => aktif === 'semua' || k.slug === aktif)
      .map((k) => ({ ...k, items: q ? k.items.filter(([n]) => n.toLowerCase().includes(q)) : k.items }))
      .filter((k) => k.items.length > 0);
  }, [aktif, cari]);

  const jumlah = kategori.reduce((n, k) => n + k.items.length, 0);

  return (
    <>
      <div
        style={{
          position: 'sticky', top: 66, zIndex: 20, padding: '16px 0',
          background: 'rgba(16,11,9,.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--s-line)',
        }}
      >
        <div className="s-wrap" style={{ display: 'grid', gap: 12 }}>
          <input
            className="s-input"
            placeholder="Cari menu… (mis. karubi, enoki, udang)"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <div className="s-tabs">
            <button className={`s-tab${aktif === 'semua' ? ' on' : ''}`} onClick={() => setAktif('semua')}>
              Semua
            </button>
            {MENU.map((k) => (
              <button
                key={k.slug}
                className={`s-tab${aktif === k.slug ? ' on' : ''}`}
                onClick={() => setAktif(k.slug)}
              >
                {k.ikon} {k.nama}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="s-sec-tight">
        <div className="s-wrap">
          <p className="s-p" style={{ marginBottom: 22 }}>
            Menampilkan <b className="s-api">{jumlah}</b> item
            {cari.trim() ? ` untuk “${cari.trim()}”` : ''}.
          </p>

          {kategori.length === 0 && (
            <div className="s-card" style={{ textAlign: 'center', padding: 44 }}>
              <div style={{ fontSize: 40 }}>🔍</div>
              <h3 className="s-h3" style={{ marginTop: 12 }}>Tidak ada menu yang cocok</h3>
              <p className="s-p" style={{ marginTop: 8 }}>Coba kata kunci lain, atau lihat semua kategori.</p>
              <button className="s-btn s-btn-ghost s-btn-sm" style={{ marginTop: 16 }} onClick={() => { setCari(''); setAktif('semua'); }}>
                Tampilkan semua
              </button>
            </div>
          )}

          <div className="s-grid s-g2">
            {kategori.map((k) => (
              <section key={k.slug} className="s-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 28 }}>{k.ikon}</span>
                  <div style={{ flex: 1 }}>
                    <h2 className="s-h3" style={{ fontSize: 21 }}>{k.nama}</h2>
                    <p className="s-p" style={{ marginTop: 6, fontSize: 14.5 }}>{k.ringkas}</p>
                  </div>
                  <span className="s-chip">{k.station}</span>
                </div>

                <ul style={{ marginTop: 18 }}>
                  {k.items.map(([nama, harga]) => (
                    <li key={nama + harga} className="s-menu-row">
                      <span className="s-menu-name">{nama}</span>
                      <span className="s-dots" />
                      <span className="s-menu-price">{rupiah(harga)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
