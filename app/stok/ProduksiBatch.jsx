'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import SupplierField from './SupplierField';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function todayISO() {
  const wib = new Date(Date.now() + 7 * 3600 * 1000);
  return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`;
}
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
}

export default function ProduksiBatch({ items, suppliers, reload }) {
  const [sub, setSub] = useState('produksi'); // produksi | daging | scan | daftar

  return (
    <div className="col">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className={`btn ${sub === 'produksi' ? 'btn-brand' : ''}`} onClick={() => setSub('produksi')}>🧂 Produksi Bumbu</button>
        <button className={`btn ${sub === 'daging' ? 'btn-brand' : ''}`} onClick={() => setSub('daging')}>🥩 Terima Daging</button>
        <button className={`btn ${sub === 'scan' ? 'btn-brand' : ''}`} onClick={() => setSub('scan')}>📷 Scan Pakai/Repack</button>
        <button className={`btn ${sub === 'daftar' ? 'btn-brand' : ''}`} onClick={() => setSub('daftar')}>📋 Daftar Batch Aktif</button>
      </div>

      {sub === 'produksi' && <ProduksiBumbu items={items} reload={reload} />}
      {sub === 'daging' && <TerimaDaging items={items} suppliers={suppliers} reload={reload} />}
      {sub === 'scan' && <ScanPakaiRepack reload={reload} />}
      {sub === 'daftar' && <DaftarBatchAktif />}
    </div>
  );
}

/* ---------- 1. Produksi Bumbu ---------- */
function ProduksiBumbu({ items, reload }) {
  const [itemId, setItemId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [qtyPerPack, setQtyPerPack] = useState('');
  const [packCount, setPackCount] = useState('1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [printUrl, setPrintUrl] = useState('');

  const selected = items.find((i) => i.id === itemId);

  async function submit() {
    if (!itemId || !qtyPerPack || Number(qtyPerPack) <= 0) { setMsg('Bahan & qty per pack wajib diisi'); return; }
    setBusy(true);
    setPrintUrl('');
    const r = await fetch('/api/stock-batches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'produce', inventory_item_id: itemId, produced_date: date, qty_per_pack: Number(qtyPerPack), pack_count: Number(packCount) || 1, note }),
    });
    const d = await r.json();
    if (r.ok) {
      await reload();
      const ids = d.batches.map((b) => b.id).join(',');
      const url = `/stok/batch-print?ids=${ids}`;
      // window.open bisa ke-block browser (tablet) karena ada jeda async;
      // sediakan juga tombol/link manual di bawah supaya tidak "hilang".
      window.open(url, '_blank');
      setPrintUrl(url);
      setQtyPerPack(''); setPackCount('1'); setNote('');
      setMsg(`✓ ${d.batches.length} pack berhasil dibuat.`);
    } else {
      setMsg(d.error || 'Gagal menyimpan');
    }
    setBusy(false);
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <div className="h2" style={{ marginBottom: 10 }}>Produksi Bumbu</div>
      <div className="col" style={{ gap: 8 }}>
        <select className="select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">— Pilih bahan —</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
        </select>
        <label className="muted small">Tanggal produksi
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="row">
          <input className="input" type="number" placeholder={`Qty per pack${selected ? ` (${selected.unit})` : ''}`} value={qtyPerPack} onChange={(e) => setQtyPerPack(e.target.value)} />
          <input className="input" type="number" placeholder="Jumlah pack" value={packCount} onChange={(e) => setPackCount(e.target.value)} />
        </div>
        <input className="input" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
        {qtyPerPack && packCount && (
          <p className="muted small" style={{ margin: 0 }}>
            Total: {Number(qtyPerPack) * (Number(packCount) || 0)} {selected?.unit} dalam {packCount} pack — {packCount} label akan dicetak.
          </p>
        )}
      </div>
      <button className="btn btn-brand btn-block" style={{ marginTop: 12 }} disabled={busy} onClick={submit}>
        {busy ? 'Menyimpan…' : 'Simpan & Cetak Label'}
      </button>
      {msg && <p className="small" style={{ marginTop: 8 }}>{msg}</p>}
      {printUrl && (
        <a href={printUrl} target="_blank" rel="noopener noreferrer" className="btn btn-green btn-block" style={{ marginTop: 8 }}>
          🖨️ Buka Label untuk Dicetak
        </a>
      )}
    </div>
  );
}

/* ---------- 2. Terima Daging (Gelondongan) ---------- */
function TerimaDaging({ items, suppliers, reload }) {
  const [itemId, setItemId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [qty, setQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [printUrl, setPrintUrl] = useState('');

  const selected = items.find((i) => i.id === itemId);
  const names = useMemo(() => suppliers.map((s) => s.name), [suppliers]);
  const isCustom = supplier.trim() && !names.some((n) => n.toLowerCase() === supplier.trim().toLowerCase());

  async function submit() {
    if (!itemId || !qty || Number(qty) <= 0) { setMsg('Bahan & qty wajib diisi'); return; }
    if (isCustom && !invoiceNo.trim()) { setMsg('Supplier belum terdaftar — No. Nota wajib diisi.'); return; }
    setBusy(true);
    setPrintUrl('');
    const r = await fetch('/api/stock-batches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'receive_lot', inventory_item_id: itemId, produced_date: date, qty: Number(qty), supplier, invoice_no: invoiceNo, cost_price: costPrice, note }),
    });
    const d = await r.json();
    if (r.ok) {
      await reload();
      const url = `/stok/batch-print?ids=${d.batch.id}`;
      window.open(url, '_blank');
      setPrintUrl(url);
      setQty(''); setSupplier(''); setInvoiceNo(''); setCostPrice(''); setNote('');
      setMsg('✓ Batch gelondongan tersimpan.');
    } else {
      setMsg(d.error || 'Gagal menyimpan');
    }
    setBusy(false);
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <div className="h2" style={{ marginBottom: 10 }}>Terima Daging (Gelondongan)</div>
      <div className="col" style={{ gap: 8 }}>
        <select className="select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">— Pilih bahan —</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
        </select>
        <label className="muted small">Tanggal terima
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <input className="input" type="number" placeholder={`Berat/Qty${selected ? ` (${selected.unit})` : ''}`} value={qty} onChange={(e) => setQty(e.target.value)} />
        <SupplierField suppliers={suppliers} value={supplier} invoiceNo={invoiceNo} onChangeSupplier={setSupplier} onChangeInvoice={setInvoiceNo} />
        <input className="input" type="number" placeholder="Harga beli / satuan (opsional)" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
        <input className="input" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="btn btn-brand btn-block" style={{ marginTop: 12 }} disabled={busy} onClick={submit}>
        {busy ? 'Menyimpan…' : 'Simpan & Cetak Label'}
      </button>
      {msg && <p className="small" style={{ marginTop: 8 }}>{msg}</p>}
      {printUrl && (
        <a href={printUrl} target="_blank" rel="noopener noreferrer" className="btn btn-green btn-block" style={{ marginTop: 8 }}>
          🖨️ Buka Label untuk Dicetak
        </a>
      )}
    </div>
  );
}

/* ---------- 3. Scan Pakai / Repack ---------- */
function ScanPakaiRepack({ reload }) {
  const [scan, setScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null); // { batch, item, fifo_blocked, older_batches, successor_batch_code }
  const [err, setErr] = useState('');
  const [qty, setQty] = useState('');
  const [mode, setMode] = useState(null); // 'pakai' | 'repack' | 'waste' | null
  const [forceReason, setForceReason] = useState('');
  const [newQty, setNewQty] = useState('');
  const [wasteReason, setWasteReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [printUrl, setPrintUrl] = useState('');

  async function lookup(code) {
    setScan(false);
    setLoading(true);
    setErr(''); setData(null); setMode(null); setPrintUrl('');
    try {
      const r = await fetch(`/api/stock-batches/${encodeURIComponent(code)}`);
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Kode tidak ditemukan'); setLoading(false); return; }
      setData(d);
      setQty(String(d.batch.qty_remaining));
    } catch {
      setErr('Gagal memeriksa kode');
    }
    setLoading(false);
  }

  function onDetected(raw) {
    const code = raw.startsWith('BATCH:') ? raw.slice(6) : null;
    if (!code) { setErr('Bukan label batch yang valid.'); setScan(false); return; }
    lookup(code);
  }

  async function pakai(force = false) {
    setBusy(true); setMsg('');
    const r = await fetch('/api/stock-batches/consume', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_code: data.batch.batch_code, qty, force, note: force ? forceReason : undefined }),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg('✓ Stok berhasil dikurangi');
      setData(null); setMode(null);
      await reload();
    } else if (r.status === 409 && d.warning) {
      setData((x) => ({ ...x, fifo_blocked: true, older_batches: d.older_batches }));
      setMode('confirm-force');
    } else {
      setMsg(d.error || 'Gagal memproses');
    }
    setBusy(false);
    setTimeout(() => setMsg(''), 4000);
  }

  // Buang/rusak: berbeda dari "Pakai" — tidak cek FIFO (barang fisik yang
  // di-scan memang yang rusak), wajib isi alasan, dicatat type='waste'.
  async function buang() {
    if (!wasteReason.trim()) { setMsg('Alasan wajib diisi'); return; }
    setBusy(true); setMsg('');
    const r = await fetch('/api/stock-batches/consume', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_code: data.batch.batch_code, qty, waste: true, note: wasteReason.trim() }),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg('✓ Dicatat sebagai rusak/susut');
      setData(null); setMode(null); setWasteReason('');
      await reload();
    } else {
      setMsg(d.error || 'Gagal memproses');
    }
    setBusy(false);
    setTimeout(() => setMsg(''), 4000);
  }

  async function repack() {
    if (!newQty || Number(newQty) <= 0) { setMsg('Berat baru wajib diisi'); return; }
    setBusy(true); setMsg('');
    const r = await fetch('/api/stock-batches/repack', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_code: data.batch.batch_code, new_qty: newQty }),
    });
    const d = await r.json();
    if (r.ok) {
      await reload();
      const url = `/stok/batch-print?ids=${d.batch.id}`;
      window.open(url, '_blank');
      setPrintUrl(url);
      setMsg('✓ Label baru dibuat.');
      setData(null); setMode(null); setNewQty('');
    } else {
      setMsg(d.error || 'Gagal repack');
    }
    setBusy(false);
    setTimeout(() => setMsg(''), 4000);
  }

  return (
    <div className="col" style={{ maxWidth: 480 }}>
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Scan Batch</div>
        <button className="btn btn-brand btn-block" onClick={() => setScan(true)}>📷 Scan Barcode Batch</button>
        {loading && <p className="muted small" style={{ marginTop: 8 }}>Memeriksa…</p>}
        {err && <p className="small" style={{ marginTop: 8, color: '#ff8585' }}>{err}</p>}
      </div>

      {data && (
        <div className="card">
          <div className="between">
            <div className="bold">{data.item.name}</div>
            <span className="badge">{data.batch.batch_code}</span>
          </div>
          <div className="muted small" style={{ marginTop: 4 }}>
            Tgl produksi/terima: {fmtDate(data.batch.produced_date)} · Sisa: {data.batch.qty_remaining} {data.batch.unit}
          </div>

          {data.batch.status === 'repacked' && (
            <p className="small" style={{ marginTop: 8, color: '#ffcf6a' }}>
              ⚠️ Batch ini sudah di-repack. Gunakan label baru: <b>{data.successor_batch_code}</b>
            </p>
          )}

          {data.batch.status === 'active' && mode !== 'confirm-force' && (
            <>
              {data.fifo_blocked && (
                <div className="card" style={{ marginTop: 8, borderColor: 'var(--red)', padding: '8px 10px' }}>
                  <div className="small" style={{ color: '#ff8585', fontWeight: 700 }}>⚠️ Ada batch lebih tua yang belum habis:</div>
                  {data.older_batches.map((o) => (
                    <div key={o.batch_code} className="small">{o.batch_code} — {fmtDate(o.produced_date)} — sisa {o.qty_remaining} {data.batch.unit}</div>
                  ))}
                  <div className="small muted" style={{ marginTop: 4 }}>Sebaiknya gunakan batch tanggal itu dulu.</div>
                </div>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                <input className="input" type="number" style={{ width: 100 }} value={qty} onChange={(e) => setQty(e.target.value)} />
                <button className="btn btn-green" disabled={busy} onClick={() => pakai(false)}>✅ Pakai</button>
              </div>
              <button className="btn btn-block" style={{ marginTop: 8 }} onClick={() => setMode('repack')}>✂️ Repack (sisa disesuaikan)</button>
              <button className="btn btn-red btn-block" style={{ marginTop: 8 }} onClick={() => setMode('waste')}>🗑️ Buang/Rusak</button>
            </>
          )}

          {mode === 'waste' && (
            <div className="card" style={{ marginTop: 8, padding: '8px 10px' }}>
              <p className="small" style={{ margin: 0 }}>Berapa {data.batch.unit} yang rusak/dibuang?</p>
              <input className="input" style={{ marginTop: 6, width: 120 }} type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
              <input className="input" style={{ marginTop: 6 }} placeholder="Alasan (mis. basi, jatuh, kadaluarsa dini)" value={wasteReason} onChange={(e) => setWasteReason(e.target.value)} />
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn btn-red btn-block" disabled={busy || !wasteReason.trim()} onClick={buang}>Catat Rusak/Susut</button>
                <button className="btn btn-block" onClick={() => { setMode(null); setWasteReason(''); }}>Batal</button>
              </div>
            </div>
          )}

          {mode === 'confirm-force' && (
            <div className="card" style={{ marginTop: 8, padding: '8px 10px' }}>
              <p className="small" style={{ margin: 0 }}>Tetap mau pakai batch ini walau ada yang lebih tua?</p>
              <input className="input" style={{ marginTop: 6 }} placeholder="Alasan (mis. batch lama rusak/hilang)" value={forceReason} onChange={(e) => setForceReason(e.target.value)} />
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn btn-red btn-block" disabled={busy || !forceReason.trim()} onClick={() => pakai(true)}>Ya, tetap pakai</button>
                <button className="btn btn-block" onClick={() => { setMode(null); }}>Batal</button>
              </div>
            </div>
          )}

          {mode === 'repack' && (
            <div className="card" style={{ marginTop: 8, padding: '8px 10px' }}>
              <p className="small" style={{ margin: 0 }}>Sisa berat sekarang (setelah dipakai/dipotong):</p>
              <input className="input" style={{ marginTop: 6 }} type="number" placeholder={`Berat baru (${data.batch.unit})`} value={newQty} onChange={(e) => setNewQty(e.target.value)} />
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn btn-brand btn-block" disabled={busy} onClick={repack}>Simpan & Cetak Label Baru</button>
                <button className="btn btn-block" onClick={() => { setMode(null); setNewQty(''); }}>Batal</button>
              </div>
            </div>
          )}
        </div>
      )}

      {msg && <div className="card" style={{ padding: '8px 12px' }}><span className="small">{msg}</span></div>}
      {printUrl && (
        <a href={printUrl} target="_blank" rel="noopener noreferrer" className="btn btn-green btn-block">
          🖨️ Buka Label Baru untuk Dicetak
        </a>
      )}
      {scan && <BarcodeScanner onDetected={onDetected} onClose={() => setScan(false)} />}
    </div>
  );
}

/* ---------- 4. Daftar Batch Aktif ---------- */
function DaftarBatchAktif() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch('/api/stock-batches?status=active');
    const d = await r.json();
    setBatches(d.batches || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const byItem = {};
    for (const b of batches) {
      const key = b.inventory_item_id;
      (byItem[key] ||= { name: b.inventory_items?.name, unit: b.inventory_items?.unit, rows: [] }).rows.push(b);
    }
    return Object.values(byItem);
  }, [batches]);

  if (loading) return <p className="muted">Memuat…</p>;

  return (
    <div className="col">
      {grouped.map((g, gi) => (
        <div key={gi} className="card">
          <div className="h2" style={{ marginBottom: 8 }}>{g.name}</div>
          {g.rows.map((b, i) => (
            <div key={b.id} className="between small" style={{ marginBottom: 4 }}>
              <span>{b.batch_code} — {fmtDate(b.produced_date)}{i === 0 ? ' ⬅ Pakai ini dulu' : ''}</span>
              <span className="bold">{b.qty_remaining} {g.unit}</span>
            </div>
          ))}
        </div>
      ))}
      {grouped.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada batch aktif.</p></div>}
    </div>
  );
}
