'use client';

import { useEffect, useMemo, useState } from 'react';
import PilihCari from '../components/PilihCari';

function angka(n) { return Number(n || 0).toLocaleString('id-ID'); }

// Daftar bahan panjang — semua pemilihannya pakai dropdown yang bisa diketik.
function opsiBahan(items) {
  return (items || []).map((i) => ({
    id: i.id,
    label: i.name,
    sub: `${i.unit}${i.category ? ` · ${i.category}` : ''}`,
  }));
}

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
  const [cara, setCara] = useState('porsi');  // porsi | satuan
  const [menuId, setMenuId] = useState('');
  const [porsi, setPorsi] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  // Pemakaian nyata & serpihan, per bahan mentah. Dikosongkan = ikut resep.
  const [pakai, setPakai] = useState({});     // input_item_id -> jumlah dipakai
  const [susut, setSusut] = useState({});     // input_item_id -> serpihan terbuang
  const [rendemen, setRendemen] = useState(null);
  const [resep, setResep] = useState(null);   // resep bahan jadi terpilih
  const [menus, setMenus] = useState([]);     // menu yang memakai bahan ini
  const [memuat, setMemuat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState('');
  const [error, setError] = useState('');

  const output = items.find((i) => i.id === outputId);
  const itemById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    setMenuId(''); setPorsi(''); setQty(''); setPakai({}); setSusut({}); setRendemen(null);
    if (!outputId) { setResep(null); setMenus([]); return; }
    setMemuat(true);
    fetch(`/api/production?output=${outputId}`)
      .then((r) => r.json())
      .then((d) => {
        setResep(d.recipes || []);
        setMenus(d.menus || []);
        // Kalau bahan ini dipakai menu, isi porsi jadi cara yang wajar;
        // kalau tidak (mis. bumbu curah), langsung isi satuannya.
        setCara((d.menus || []).length ? 'porsi' : 'satuan');
        if ((d.menus || []).length === 1) setMenuId(d.menus[0].id);
      })
      .catch(() => { setResep([]); setMenus([]); })
      .finally(() => setMemuat(false));
  }, [outputId]);

  const menu = menus.find((m) => m.id === menuId);
  const perPorsi = Number(menu?.per_porsi) || 0;
  // Semua perhitungan stok tetap dalam satuan bahan (gram). "Porsi" cuma
  // cara mengetiknya, karena satu bahan dipakai beberapa menu dengan takaran
  // berbeda — stok per porsi akan ambigu porsi menu yang mana.
  const jumlah = cara === 'porsi'
    ? Math.round(perPorsi * (Number(porsi) || 0) * 1000) / 1000
    : Number(qty) || 0;

  async function simpan() {
    setError(''); setPesan('');
    if (!outputId) return setError('Pilih dulu bahan hasil produksinya.');
    if (cara === 'porsi' && !menuId) return setError('Pilih menunya dulu supaya takaran per porsi diketahui.');
    if (!(jumlah > 0)) return setError('Jumlah hasil produksi wajib diisi.');
    setBusy(true);
    try {
      const catatan = cara === 'porsi' && menu
        ? [`${angka(Number(porsi))} porsi ${menu.name}`, note].filter(Boolean).join(' — ')
        : note;
      const bersih = (obj) => Object.fromEntries(
        Object.entries(obj).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])
      );
      const r = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_item_id: outputId, qty: jumlah, note: catatan,
          pakai: bersih(pakai), susut: bersih(susut),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan produksi');
      setRendemen(d.rendemen || null);
      setPesan(
        `✓ ${angka(jumlah)} ${output?.unit} ${output?.name} ditambahkan` +
        (cara === 'porsi' && menu ? ` (= ${angka(Number(porsi))} porsi ${menu.name})` : '') +
        (d.dipakai?.length ? `, ${d.dipakai.length} bahan mentah berkurang` : '')
      );
      setPorsi(''); setQty(''); setNote(''); setPakai({}); setSusut({});
      await reload();
      setTimeout(() => setPesan(''), 8000);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Catat Hasil Produksi</div>

        <label className="muted small">Bahan yang dihasilkan</label>
        <PilihCari
          style={{ marginTop: 4 }}
          options={opsiBahan(items)}
          value={outputId} onChange={setOutputId}
          placeholder="Cari bahan hasil produksi…"
        />

        {outputId && menus.length > 0 && (
          <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
            <button className={`btn ${cara === 'porsi' ? 'btn-brand' : ''}`}
              onClick={() => setCara('porsi')}>Hitung dari porsi menu</button>
            <button className={`btn ${cara === 'satuan' ? 'btn-brand' : ''}`}
              onClick={() => setCara('satuan')}>Isi langsung ({output?.unit})</button>
          </div>
        )}

        {outputId && cara === 'porsi' && menus.length > 0 && (
          <>
            <label className="muted small" style={{ display: 'block', marginTop: 12 }}>Menu yang diproduksi</label>
            <PilihCari
              style={{ marginTop: 4 }}
              options={menus.map((m) => ({
                id: m.id, label: m.name,
                sub: `${angka(m.per_porsi)} ${output?.unit}/porsi`,
              }))}
              value={menuId} onChange={setMenuId}
              placeholder="Cari menu…"
            />

            <label className="muted small" style={{ display: 'block', marginTop: 12 }}>Jumlah porsi</label>
            <input className="input" style={{ marginTop: 4 }} inputMode="decimal"
              placeholder="mis. 5" value={porsi} onChange={(e) => setPorsi(e.target.value)} />

            {menuId && jumlah > 0 && (
              <p className="small" style={{ marginTop: 6 }}>
                {angka(Number(porsi))} porsi × {angka(perPorsi)} {output?.unit} ={' '}
                <b>{angka(jumlah)} {output?.unit}</b> masuk stok{' '}
                <b>{output?.name}</b>.
              </p>
            )}
          </>
        )}

        {outputId && (cara === 'satuan' || menus.length === 0) && (
          <>
            <label className="muted small" style={{ display: 'block', marginTop: 12 }}>
              Jumlah hasil {output ? `(dalam ${output.unit})` : ''}
            </label>
            <input className="input" style={{ marginTop: 4 }} inputMode="decimal"
              placeholder={output ? `Jumlah dalam ${output.unit}` : 'Pilih bahan dulu'}
              value={qty} onChange={(e) => setQty(e.target.value)} />
          </>
        )}

        <input className="input" style={{ marginTop: 10 }} placeholder="Catatan (opsional)"
          value={note} onChange={(e) => setNote(e.target.value)} />

        {/* Stok bahan ini setara berapa porsi tiap menu, sesudah produksi ini */}
        {outputId && menus.length > 0 && (
          <div className="card" style={{ marginTop: 12, background: 'var(--card2)' }}>
            <div className="bold small" style={{ marginBottom: 6 }}>
              Setelah disimpan, stok {output?.name} cukup untuk
            </div>
            {menus.map((m) => {
              const sisa = Number(output?.stock_qty || 0) + jumlah;
              return (
                <div key={m.id} className="between small" style={{ marginBottom: 4 }}>
                  <span>{m.name}</span>
                  <span>
                    <b>{Math.floor(sisa / m.per_porsi)} porsi</b>
                    <span className="muted"> · {angka(m.per_porsi)} {output?.unit}/porsi</span>
                  </span>
                </div>
              );
            })}
            <p className="muted small" style={{ margin: '6px 0 0' }}>
              Angka ini berbagi stok yang sama — kalau satu menu terjual,
              sisa porsi menu lain ikut turun.
            </p>
          </div>
        )}

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
              if (!bahan) return null;
              const perkiraan = Number(r.qty) * jumlah;
              const nyata = Number(pakai[bahan.id]) > 0 ? Number(pakai[bahan.id]) : perkiraan;
              const buang = Number(susut[bahan.id]) || 0;
              const kurang = Number(bahan.stock_qty) < nyata;
              const beda = nyata - perkiraan;
              return (
                <div key={r.id} style={{ marginBottom: 10 }}>
                  <div className="between small">
                    <span className="bold">{bahan.name}</span>
                    <span>
                      <b>− {angka(nyata)} {bahan.unit}</b>
                      <span className="muted"> · sisa {angka(bahan.stock_qty)}</span>
                      {kurang && <span className="badge badge-amber" style={{ marginLeft: 6, fontSize: 10 }}>kurang</span>}
                    </span>
                  </div>
                  <div className="row" style={{ marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
                    <label className="muted small" style={{ flex: 1, minWidth: 130 }}>
                      Dipakai sebenarnya ({bahan.unit})
                      <input className="input" style={{ padding: '6px 9px', fontSize: 13 }}
                        inputMode="decimal" placeholder={`resep: ${angka(perkiraan)}`}
                        value={pakai[bahan.id] ?? ''}
                        onChange={(e) => setPakai((p) => ({ ...p, [bahan.id]: e.target.value }))} />
                    </label>
                    <label className="muted small" style={{ flex: 1, minWidth: 130 }}>
                      Serpihan terbuang ({bahan.unit})
                      <input className="input" style={{ padding: '6px 9px', fontSize: 13 }}
                        inputMode="decimal" placeholder="0"
                        value={susut[bahan.id] ?? ''}
                        onChange={(e) => setSusut((p) => ({ ...p, [bahan.id]: e.target.value }))} />
                    </label>
                  </div>
                  {Math.abs(beda) > 0.001 && (
                    <p className="small" style={{ margin: '3px 0 0', color: beda > 0 ? '#9a6b06' : '#16794a' }}>
                      {beda > 0 ? '+' : ''}{angka(Math.round(beda * 1000) / 1000)} {bahan.unit} dari perkiraan resep
                      ({angka(perkiraan)}).
                    </p>
                  )}
                  {buang > 0 && nyata > 0 && (
                    <p className="muted small" style={{ margin: '2px 0 0' }}>
                      Serpihan {angka(buang)} {bahan.unit} = {Math.round((buang / nyata) * 1000) / 10}% dari yang dipakai.
                    </p>
                  )}
                </div>
              );
            })}
            {!memuat && (resep || []).length > 0 && (
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Kolom <b>dipakai sebenarnya</b> boleh dikosongkan kalau sesuai resep.
                <b> Serpihan</b> adalah bagian dari yang dipakai, bukan tambahan — jadi
                stok tidak dipotong dua kali.
              </p>
            )}
          </div>
        )}

        {rendemen && (
          <div className="card" style={{ marginTop: 12, borderColor: 'var(--brand)' }}>
            <div className="bold small" style={{ marginBottom: 6 }}>📐 Rendemen produksi barusan</div>
            <div className="between small"><span className="muted">{rendemen.bahan} dipakai</span>
              <b>{angka(rendemen.dipakai)}</b></div>
            <div className="between small"><span className="muted">Jadi hasil</span>
              <b>{angka(rendemen.hasil)}</b></div>
            {rendemen.susut > 0 && (
              <div className="between small"><span className="muted">Serpihan terbuang</span>
                <b>{angka(rendemen.susut)}</b></div>
            )}
            <div className="between small" style={{ marginTop: 4 }}>
              <span className="muted">Rendemen</span><b>{rendemen.persen}%</b>
            </div>
            <hr className="hr" />
            <p className="small" style={{ margin: 0 }}>
              Takaran sebenarnya kali ini: <b>{angka(rendemen.takaran_sebenarnya)}</b> bahan
              mentah per 1 hasil. Kalau angka ini terus muncul beda dari resep, ubah
              takarannya di <b>⚙️ Atur Resep Produksi</b> supaya perkiraan stok makin tepat.
            </p>
            <p className="muted small" style={{ margin: '6px 0 0' }}>
              Jangan diubah hanya karena sekali meleset — tunggu tiga sampai lima kali
              produksi dan pakai angka yang paling sering muncul.
            </p>
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
  // Dua cara mengetik takaran yang sama. "bagi" untuk bahan yang dipotong jadi
  // beberapa bagian (1 bakso jadi 2), "butuh" untuk bahan yang menyusut saat
  // diolah (1,15 gram gelondongan jadi 1 gram potongan). Menyuruh staf
  // menghitung sendiri 1÷2 = 0,5 hanya mengundang salah ketik.
  const [cara, setCara] = useState('butuh');  // butuh | bagi
  const [bagi, setBagi] = useState('2');
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

  // Takaran yang disimpan selalu "bahan mentah per 1 hasil", apa pun cara
  // mengetiknya. Satu bentuk penyimpanan, dua cara memasukkan.
  const takaran = cara === 'bagi'
    ? (Number(bagi) > 0 ? Math.round((1 / Number(bagi)) * 100000) / 100000 : 0)
    : Number(qty);

  async function tambah() {
    setError('');
    if (!outputId || !inputId) return setError('Pilih bahan hasil dan bahan mentahnya.');
    if (outputId === inputId) return setError('Bahan hasil dan bahan mentah tidak boleh sama.');
    if (!(takaran > 0)) return setError('Takaran harus lebih dari 0.');
    setBusy(true);
    try {
      const r = await fetch('/api/production/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_item_id: outputId, input_item_id: inputId, qty: takaran }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal menyimpan');
      setInputId(''); setQty('1'); setBagi('2');
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
        <PilihCari
          style={{ marginTop: 4 }}
          options={opsiBahan(items)}
          value={outputId} onChange={setOutputId}
          placeholder="Cari bahan hasil…"
        />

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
              <PilihCari
                style={{ flex: 2, minWidth: 180 }}
                options={opsiBahan(items.filter((i) => i.id !== outputId))}
                value={inputId} onChange={setInputId}
                placeholder="Cari bahan mentah…"
              />
              {cara === 'butuh' ? (
                <input className="input" style={{ maxWidth: 120 }} inputMode="decimal"
                  placeholder="Takaran" value={qty} onChange={(e) => setQty(e.target.value)} />
              ) : (
                <input className="input" style={{ maxWidth: 120 }} inputMode="decimal"
                  placeholder="Jadi berapa" value={bagi} onChange={(e) => setBagi(e.target.value)} />
              )}
              <button className="btn btn-brand" disabled={busy} onClick={tambah}>Tambah</button>
            </div>

            <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${cara === 'butuh' ? 'chip-on' : ''}`} onClick={() => setCara('butuh')}>
                Butuh ___ bahan untuk 1 hasil
              </button>
              <button className={`chip ${cara === 'bagi' ? 'chip-on' : ''}`} onClick={() => setCara('bagi')}>
                1 bahan dibagi jadi ___
              </button>
            </div>

            {inputId && takaran > 0 && (
              <p className="small" style={{ marginTop: 6 }}>
                {cara === 'bagi'
                  ? <>1 {itemById[inputId]?.unit} <b>{itemById[inputId]?.name}</b> dibagi jadi{' '}
                      <b>{angka(Number(bagi))}</b> {output?.unit} {output?.name}.</>
                  : <>Butuh <b>{angka(Number(qty))}</b> {itemById[inputId]?.unit}{' '}
                      <b>{itemById[inputId]?.name}</b> untuk 1 {output?.unit} {output?.name}.</>}
                <span className="muted"> Tersimpan sebagai takaran {angka(takaran)}.</span>
              </p>
            )}

            {error && <p className="small" style={{ color: '#ff8585', marginTop: 8 }}>{error}</p>}

            <div className="card" style={{ marginTop: 12 }}>
              <p className="muted small" style={{ margin: 0 }}>
                <b>Bahan menyusut saat diolah</b> — pakai “Butuh ___ untuk 1 hasil”.
                Kalau 1.150 gram daging gelondongan menghasilkan 1.000 gram potongan
                siap pakai, isi <b>1,15</b>; sisanya tulang dan lemak yang terbuang.
              </p>
              <p className="muted small" style={{ margin: '6px 0 0' }}>
                <b>Bahan dipotong jadi beberapa bagian</b> — pakai “1 bahan dibagi jadi ___”.
                Bakso sapi beku dibelah dua, isi <b>2</b>. Beef patty dipotong empat,
                isi <b>4</b>. Sistem yang menghitung takarannya.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
