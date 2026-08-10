'use client';

import { useCallback, useEffect, useState } from 'react';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function hariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}
function awalBulanWIB() {
  const s = hariIniWIB();
  return `${s.slice(0, 7)}-01`;
}

// Ringkasan uang untuk KASIR: omzet, cara bayar, pengeluaran, biaya tetap.
// Sengaja TIDAK menampilkan HPP, margin, atau laba — itu ada di dashboard
// Owner, dan kasir tidak perlu tahu margin tiap menu.
export default function OmzetTab() {
  const [dari, setDari] = useState(hariIniWIB());
  const [sampai, setSampai] = useState(hariIniWIB());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const muat = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/cashier/summary?dari=${dari}&sampai=${sampai}`);
    const d = await r.json();
    setData(d);
    setLoading(false);
  }, [dari, sampai]);

  useEffect(() => { muat(); }, [muat]);

  function pilihHariIni() { const t = hariIniWIB(); setDari(t); setSampai(t); }
  function pilihKemarin() {
    const k = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    setDari(k); setSampai(k);
  }
  function pilihBulanIni() { setDari(awalBulanWIB()); setSampai(hariIniWIB()); }

  const stat = (label, nilai, ket, warna) => (
    <div className="card">
      <div className="muted small">{label}</div>
      <div className="bold" style={{ fontSize: 21, marginTop: 3, color: warna || undefined }}>{nilai}</div>
      {ket && <div className="muted small" style={{ marginTop: 2 }}>{ket}</div>}
    </div>
  );

  return (
    <div className="col">
      <div className="card">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={pilihHariIni}>Hari ini</button>
          <button className="btn" onClick={pilihKemarin}>Kemarin</button>
          <button className="btn" onClick={pilihBulanIni}>Bulan ini</button>
        </div>
        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="muted small">Dari
            <input className="input" type="date" value={dari} max={sampai}
              onChange={(e) => setDari(e.target.value)} />
          </label>
          <label className="muted small">Sampai
            <input className="input" type="date" value={sampai} min={dari} max={hariIniWIB()}
              onChange={(e) => setSampai(e.target.value)} />
          </label>
        </div>
      </div>

      {loading && <p className="muted">Memuat…</p>}

      {data && !loading && (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
            {stat('Omzet (lunas)', rupiah(data.omzet), `${data.order_lunas} transaksi`, '#16794a')}
            {stat('Pengeluaran operasional', rupiah(data.pengeluaran.total), 'kas kecil')}
            {stat('Biaya tetap', rupiah(data.biaya_tetap.rentang),
              `${rupiah(data.biaya_tetap.per_hari)}/hari × ${data.hari} hari`)}
            {stat('Total biaya', rupiah(data.total_biaya), 'operasional + tetap', '#c0271f')}
            {stat('Sisa', rupiah(data.sisa), 'omzet − total biaya',
              data.sisa >= 0 ? '#16794a' : '#c0271f')}
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
            <div className="card">
              <div className="h2" style={{ marginBottom: 10 }}>Cara Pembayaran</div>
              <div className="between">
                <span className="muted">QRIS ({data.cara_bayar.qris.jumlah} transaksi)</span>
                <span className="bold">{rupiah(data.cara_bayar.qris.nilai)}</span>
              </div>
              <div className="between" style={{ marginTop: 6 }}>
                <span className="muted">Tunai / Kasir ({data.cara_bayar.cashier.jumlah} transaksi)</span>
                <span className="bold">{rupiah(data.cara_bayar.cashier.nilai)}</span>
              </div>
              <hr className="hr" />
              <div className="between"><span className="bold">Total diterima</span><span className="bold">{rupiah(data.omzet)}</span></div>

              {data.belum_bayar.jumlah > 0 && (
                <p className="small" style={{ marginTop: 10, color: '#9a6b06' }}>
                  ⏸ {data.belum_bayar.jumlah} tagihan belum dibayar senilai {rupiah(data.belum_bayar.nilai)} —
                  belum masuk hitungan omzet.
                </p>
              )}
              {data.batal.jumlah > 0 && (
                <p className="small" style={{ marginTop: 6, color: '#c0271f' }}>
                  ✖ {data.batal.jumlah} tagihan dibatalkan senilai {rupiah(data.batal.nilai)}.
                </p>
              )}
            </div>

            <div className="card">
              <div className="h2" style={{ marginBottom: 10 }}>Pengeluaran per Jenis</div>
              {Object.keys(data.pengeluaran.per_kategori).length === 0 && (
                <p className="muted small" style={{ margin: 0 }}>Belum ada pengeluaran dicatat.</p>
              )}
              {Object.entries(data.pengeluaran.per_kategori)
                .sort((a, b) => b[1] - a[1])
                .map(([kat, nilai]) => (
                  <div key={kat} className="between" style={{ marginBottom: 6 }}>
                    <span className="muted">{kat}</span>
                    <span className="bold">{rupiah(nilai)}</span>
                  </div>
                ))}
              {data.pengeluaran.isi_kas > 0 && (
                <p className="small muted" style={{ marginTop: 8 }}>
                  Isi ulang kas kecil: {rupiah(data.pengeluaran.isi_kas)}
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{ marginBottom: 8 }}>Rincian Pengeluaran</div>
            {data.pengeluaran.rincian.length === 0 && (
              <p className="muted small" style={{ margin: 0 }}>Belum ada.</p>
            )}
            {data.pengeluaran.rincian.map((p) => (
              <div key={p.id} className="between small" style={{ marginBottom: 5 }}>
                <span>
                  {p.category && <span className="badge" style={{ marginRight: 6 }}>{p.category}</span>}
                  {p.note || '(tanpa keterangan)'}
                  {p.created_by && <span className="muted"> · {p.created_by}</span>}
                </span>
                <span className="bold">{rupiah(p.amount)}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <p className="muted small" style={{ margin: 0 }}>
              Biaya tetap dihitung dari total biaya bulanan dibagi{' '}
              <b>{data.biaya_tetap.hari_buka_per_bulan} hari buka</b> per bulan
              ({rupiah(data.biaya_tetap.total_bulanan)}/bulan). Rincian gaji dan sewa
              diatur di halaman Owner.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
