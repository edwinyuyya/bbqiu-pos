'use client';

import { useEffect, useMemo, useState } from 'react';

function angka(n) { return Number(n || 0).toLocaleString('id-ID'); }

// Produksi = mengubah bahan mentah jadi bahan siap pakai.
// Contoh: daging gelondongan diiris jadi porsi karubi.
//
// Sekali jalan, sistem melakukan dua hal sekaligus: menambah stok bahan
// jadi DAN mengurangi bahan mentahnya. Sebelumnya dua langkah terpisah,
// dan langkah kedua hampir selalu terlewat saat sibuk — akibatnya daging
// tercatat dua kali.
export default function Produksi({ items, reload }) {
  const [sub, setSub] = useState('jalan'); // jalan | resep

  return (
    <div className="col">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className={`btn ${sub === 'jalan' ? 'btn-brand' : ''}`} onClick={() => setSub('jalan')}>
          🍳 Catat Produksi
        </button>
        <button className={`btn ${sub === 'resep' ? 'btn-brand' : ''}`} onClick={() => setSub('resep')}>
          ⚙️ Atur Resep Produksi
        </button>
      </div>

      {sub === 'jalan' ? <CatatProduksi items={items} reload={reload} />
                       : <AturResep items={items} />}
    </div>
  );
}

/* ================= CATAT PRODUKSI ================= */
function CatatProduksi({ items, reload }) {
  const [outputId, setOutputId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [resep, setResep] = useState(null);   // resep bahan jadi terpilih
  const [memuat, setMemuat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState('');
  const [error, setError] = useState('');

  const output = items.find((i) => i.id === outputId);
  const itemById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    if (!outputId) { setResep(null); return; }
    setMemuat(true);
    fetch(`/api/production?output=${outputId}`)
      .then((r) => r.json())
      .then((d) => setResep(d.recipes || []))
      .catch(() => setResep([]))
      .finally(() => setMemuat(false));
  }, [outputId]);

  const jumlah = Number(qty) || 0;

  async function simpan() {
    setError(''); setPesan('');
    if (!outputId) return setError('Pilih dulu bahan hasil produksinya.');
    if (!(jumlah > 0)) return setError('Jumlah hasil produksi wajib diisi.');
    setBusy(true);
    try {
      const r = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_item_id: outputId, qty: jumlah, note }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan produksi');
      setPesan(
        `✓ ${angka(jumlah)} ${output?.unit} ${output?.name} ditambahkan` +
        (d.dipakai?.length ? `, ${d.dipakai.length} bahan mentah berkurang` : '')
      );
      setQty(''); setNote('');
      await reload();
      setTimeout(() => setPesan(''), 6000);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Catat Hasil Produksi</div>

        <label className="muted small">Bahan yang dihasilkan</label>
        <select className="select" style={{ marginTop: 4 }} value={outputId}
          onChange={(e) => setOutputId(e.target.value)}>
          <option value="">— Pilih bahan hasil produksi —</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
          ))}
        </select>

        <label className="muted small" style={{ display: 'block', marginTop: 12 }}>
          Jumlah hasil {output ? `(dalam ${output.unit})` : ''}
        </label>
        <input className="input" style={{ marginTop: 4 }} inputMode="decimal"
          placeholder={output ? `Jumlah dalam ${output.unit}` : 'Pilih bahan dulu'}
          value={qty} onChange={(e) => setQty(e.target.value)} />

        <input className="input" style={{ marginTop: 10 }} placeholder="Catatan (opsional)"
          value={note} onChange={(e) => setNote(e.target.value)} />

        {/* Pratinjau: apa yang akan berkurang */}
        {outputId && (
          <div className="card" style={{ marginTop: 12, background: 'var(--card2)' }}>
            <div className="bold small" style={{ marginBottom: 6 }}>Bahan mentah yang akan berkurang</div>
            {memuat && <p className="muted small" style={{ margin: 0 }}>Memuat resep…</p>}
            {!memuat && resep && resep.length === 0 && (
              <p className="small" style={{ margin: 0, color: '#9a6b06' }}>
                Bahan ini belum punya resep produksi. Stoknya tetap akan bertambah,
                tapi <b>tidak ada bahan mentah yang berkurang</b>. Atur dulu di tab
                “⚙️ Atur Resep Produksi” kalau memang dibuat dari bahan lain.
              </p>
            )}
            {!memuat && (resep || []).map((r) => {
              const bahan = itemById[r.input_item_id];
              const pakai = Number(r.qty) * jumlah;
              const kurang = bahan && Number(bahan.stock_qty) < pakai;
              return (
                <div key={r.id} className="between small" style={{ marginBottom: 4 }}>
                  <span>{bahan?.name || '(bahan terhapus)'}</span>
                  <span>
                    <b>− {angka(pakai)} {bahan?.unit}</b>
                    {bahan && (
                      <span className="muted"> · sisa {angka(bahan.stock_qty)}</span>
                    )}
                    {kurang && <span className="badge badge-amber" style={{ marginLeft: 6, fontSize: 10 }}>kurang</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="small" style={{ color: '#ff8585', marginTop: 8 }}>{error}</p>}
        {pesan && <p className="small" style={{ color: '#16794a', marginTop: 8 }}>{pesan}</p>}

        <button className="btn btn-brand btn-block" style={{ marginTop: 12 }} disabled={busy} onClick={simpan}>
          {busy ? 'Menyimpan…' : 'Simpan Produksi'}
        </button>
      </div>

      <div className="card">
        <p className="muted small" style={{ margin: 0 }}>
          Stok bahan mentah boleh jadi minus kalau catatannya belum lengkap —
          produksi tidak akan ditolak. Angka minus artinya ada barang masuk yang
          belum sempat dicatat; luruskan lewat <b>🧮 Opname Massal</b>.
        </p>
      </div>
    </div>
  );
}

/* ================= ATUR RESEP PRODUKSI ================= */
function AturResep({ items }) {
  const [outputId, setOutputId] = useState('');
  const [resep, setResep] = useState([]);
  const [inputId, setInputId] = useState('');
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const output = items.find((i) => i.id === outputId);
  const itemById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  async function muat(id) {
    if (!id) { setResep([]); return; }
    const r = await fetch(`/api/production?output=${id}`);
    const d = await r.json();
    setResep(d.recipes || []);
  }
  useEffect(() => { muat(outputId); }, [outputId]);

  async function tambah() {
    setError('');
    if (!outputId || !inputId) return setError('Pilih bahan hasil dan bahan mentahnya.');
    if (outputId === inputId) return setError('Bahan hasil dan bahan mentah tidak boleh sama.');
    if (!(Number(qty) > 0)) return setError('Takaran harus lebih dari 0.');
    setBusy(true);
    try {
      const r = await fetch('/api/production/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_item_id: outputId, input_item_id: inputId, qty: Number(qty) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan');
      setInputId(''); setQty('1');
      await muat(outputId);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function hapus(id) {
    await fetch(`/api/production/recipes?id=${id}`, { method: 'DELETE' });
    muat(outputId);
  }

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 6 }}>Atur Resep Produksi</div>
        <p className="muted small" style={{ marginTop: 0 }}>
          Tentukan bahan mentah apa yang terpakai untuk membuat satu bahan jadi.
          Cukup diatur sekali; setelah itu produksi tinggal isi jumlah.
        </p>

        <label className="muted small">Bahan hasil produksi</label>
        <select className="select" style={{ marginTop: 4 }} value={outputId}
          onChange={(e) => setOutputId(e.target.value)}>
          <option value="">— Pilih bahan hasil —</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
        </select>

        {outputId && (
          <>
            <div className="card" style={{ marginTop: 12, background: 'var(--card2)' }}>
              <div className="bold small" style={{ marginBottom: 6 }}>
                Untuk membuat 1 {output?.unit} {output?.name}, dibutuhkan:
              </div>
              {resep.length === 0 && (
                <p className="muted small" style={{ margin: 0 }}>Belum ada bahan. Tambahkan di bawah.</p>
              )}
              {resep.map((r) => {
                const bahan = itemById[r.input_item_id];
                return (
                  <div key={r.id} className="between small" style={{ marginBottom: 4 }}>
                    <span>{bahan?.name || '(bahan terhapus)'}</span>
                    <span>
                      <b>{angka(r.qty)} {bahan?.unit}</b>
                      <button className="btn" style={{ padding: '2px 8px', fontSize: 12, marginLeft: 8 }}
                        onClick={() => hapus(r.id)}>hapus</button>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <select className="select" style={{ flex: 2, minWidth: 180 }} value={inputId}
                onChange={(e) => setInputId(e.target.value)}>
                <option value="">— Bahan mentah —</option>
                {items.filter((i) => i.id !== outputId)
                  .map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
              <input className="input" style={{ maxWidth: 120 }} inputMode="decimal"
                placeholder="Takaran" value={qty} onChange={(e) => setQty(e.target.value)} />
              <button className="btn btn-brand" disabled={busy} onClick={tambah}>Tambah</button>
            </div>
            {error && <p className="small" style={{ color: '#ff8585', marginTop: 8 }}>{error}</p>}

            <div className="card" style={{ marginTop: 12 }}>
              <p className="muted small" style={{ margin: 0 }}>
                <b>Contoh mengisi susut potong:</b> kalau 1.150 gram daging gelondongan
                menghasilkan 1.000 gram potongan siap pakai, isi takarannya <b>1,15</b> —
                sisanya tulang dan lemak yang terbuang.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
