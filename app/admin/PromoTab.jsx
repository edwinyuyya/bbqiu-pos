'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SCOPE, SCOPE_LABEL, cekPromo, ringkasLingkup, hariIniWIB } from '../../lib/promo';

const KOSONG = {
  code: '', name: '', percent: '', scope: SCOPE.ALL,
  scope_category_ids: [], valid_from: '', valid_until: '',
};

export default function PromoTab({ promos, categories, reload }) {
  const [form, setForm] = useState(KOSONG);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const namaKategori = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  function toggleKategori(id) {
    setForm((f) => ({
      ...f,
      scope_category_ids: f.scope_category_ids.includes(id)
        ? f.scope_category_ids.filter((x) => x !== id)
        : [...f.scope_category_ids, id],
    }));
  }

  async function tambah() {
    setError('');
    const code = form.code.trim();
    const percent = Number(form.percent);
    if (!code) return setError('Kode wajib diisi.');
    if (!form.name.trim()) return setError('Keterangan wajib diisi.');
    if (!(percent > 0 && percent <= 100)) return setError('Persentase harus antara 1–100.');
    if (form.scope !== SCOPE.ALL && form.scope_category_ids.length === 0)
      return setError('Pilih minimal satu kategori.');
    if (form.valid_from && form.valid_until && form.valid_from > form.valid_until)
      return setError('Tanggal mulai melewati tanggal berakhir.');

    setBusy(true);
    const { error: e } = await supabase.from('promos').insert({
      code,
      name: form.name.trim(),
      percent,
      scope: form.scope,
      scope_category_ids: form.scope === SCOPE.ALL ? [] : form.scope_category_ids,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      active: true,
    });
    setBusy(false);
    if (e) {
      setError(e.code === '23505' ? 'Kode itu sudah dipakai promo lain.' : 'Gagal menyimpan promo.');
      return;
    }
    setForm(KOSONG);
    reload();
  }

  async function toggleAktif(p) {
    await supabase.from('promos').update({ active: !p.active }).eq('id', p.id);
    reload();
  }
  async function hapus(p) {
    if (!confirm(`Hapus promo ${p.code}?\n\nBill lama yang sudah memakai kode ini tidak berubah.`)) return;
    await supabase.from('promos').delete().eq('id', p.id);
    reload();
  }

  const hariIni = hariIniWIB();

  return (
    <div className="col">
      <div className="card">
        <div className="h2" style={{ marginBottom: 10 }}>Tambah Kode Promo</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <input className="input" style={{ maxWidth: 200 }} placeholder="Kode (mis. bbqiuopen50)"
            value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="input" style={{ maxWidth: 110 }} inputMode="numeric" placeholder="Diskon %"
            value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
          <input className="input" placeholder="Keterangan (mis. Promo soft opening)"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="muted small">Berlaku untuk</div>
          <div className="opt-row" style={{ marginTop: 4 }}>
            {Object.values(SCOPE).map((s) => (
              <button key={s} type="button"
                className={`chip ${form.scope === s ? 'chip-on' : ''}`}
                onClick={() => setForm({ ...form, scope: s })}>
                {SCOPE_LABEL[s]}
              </button>
            ))}
          </div>
          {form.scope !== SCOPE.ALL && (
            <div className="opt-row" style={{ marginTop: 8 }}>
              {categories.map((c) => (
                <button key={c.id} type="button"
                  className={`chip ${form.scope_category_ids.includes(c.id) ? 'chip-on' : ''}`}
                  onClick={() => toggleKategori(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div className="muted small">Mulai (kosong = langsung)</div>
            <input className="input" type="date" value={form.valid_from}
              onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
          </div>
          <div>
            <div className="muted small">Sampai (kosong = sampai dibatalkan)</div>
            <input className="input" type="date" value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
          </div>
        </div>

        {error && <p className="small" style={{ color: '#ff8585', marginTop: 8 }}>{error}</p>}
        <button className="btn btn-brand btn-block" style={{ marginTop: 12 }} disabled={busy} onClick={tambah}>
          {busy ? 'Menyimpan…' : 'Tambah Promo'}
        </button>
      </div>

      {promos.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Belum ada kode promo.</p></div>
      )}

      {promos.map((p) => {
        const sah = cekPromo(p, hariIni);
        return (
          <div key={p.id} className="card">
            <div className="between">
              <div>
                <span className="bold" style={{ fontSize: 17 }}>{p.code}</span>
                <span className="badge badge-blue" style={{ marginLeft: 8 }}>{Number(p.percent)}%</span>
              </div>
              <span className={`badge ${sah.ok ? 'badge-green' : 'badge-red'}`}>
                {sah.ok ? 'Berlaku' : 'Tidak berlaku'}
              </span>
            </div>
            <div className="muted small" style={{ marginTop: 4 }}>{p.name}</div>
            <div className="small" style={{ marginTop: 6 }}>
              {ringkasLingkup(p, namaKategori)}
            </div>
            <div className="muted small" style={{ marginTop: 2 }}>
              {p.valid_from || p.valid_until
                ? `Berlaku ${p.valid_from || '—'} s/d ${p.valid_until || 'dibatalkan'}`
                : 'Berlaku sampai dibatalkan'}
              {' · '}dipakai {p.used_count || 0}×
            </div>
            {!sah.ok && (
              <div className="small" style={{ marginTop: 4, color: '#c0271f' }}>{sah.alasan}</div>
            )}
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btn-block" onClick={() => toggleAktif(p)}>
                {p.active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button className="btn btn-block" onClick={() => hapus(p)}>Hapus</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
