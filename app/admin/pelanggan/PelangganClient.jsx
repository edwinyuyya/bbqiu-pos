'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CariBox from '../../components/CariBox';
import { cocok } from '../../../lib/cari';
import { bacaJson } from '../../../lib/bacaJson';
import { linkWA } from '../../../lib/wa';
import { KUNJUNGAN_HADIAH, ulangTahunDalam } from '../../../lib/pelanggan';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function tglID(iso, denganJam = false) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
      ...(denganJam ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  } catch { return iso; }
}

// Rincian satu pelanggan: transaksinya, menu favorit, dan status hadiah.
function Rincian({ id, onTutup }) {
  const [data, setData] = useState(null);
  const [gagal, setGagal] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/customers/${id}`);
        const d = await bacaJson(r);
        if (!r.ok) throw new Error(d.error || 'Gagal memuat');
        setData(d);
      } catch (e) { setGagal(e.message); }
    })();
  }, [id]);

  const c = data?.customer;
  const wa = c ? linkWA(c.phone, `Halo ${c.name}, terima kasih sudah jadi pelanggan BBQIU 🙏`) : null;

  return (
    <div className="tirai" onClick={onTutup}>
      <div className="card kotak" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        {!data && !gagal && <p className="muted" style={{ margin: 0 }}>Memuat…</p>}
        {gagal && <p className="small" style={{ color: '#c0271f', margin: 0 }}>{gagal}</p>}

        {c && (
          <>
            <div className="between">
              <div>
                <div className="h2" style={{ marginBottom: 2 }}>{c.name}</div>
                <div className="muted small">{c.phone}</div>
              </div>
              <button className="btn" onClick={onTutup}>✕</button>
            </div>

            <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              <span className="badge badge-green">{c.visit_count}× datang</span>
              <span className="badge">{data.orders.length} bill</span>
              <span className="badge">{rupiah(data.total_belanja)}</span>
              {c.birth_date && <span className="badge badge-blue">🎂 {tglID(c.birth_date)}</span>}
              {c.berhak_hadiah && <span className="badge badge-amber">🎁 berhak hadiah</span>}
              {c.reward_claimed_at && (
                <span className="badge">hadiah diambil{c.reward_item ? `: ${c.reward_item}` : ''}</span>
              )}
            </div>

            {!c.berhak_hadiah && !c.reward_claimed_at && c.sisa_menuju_hadiah > 0 && (
              <p className="muted small" style={{ marginTop: 8 }}>
                {c.sisa_menuju_hadiah} kunjungan lagi menuju hadiah (ke-{KUNJUNGAN_HADIAH}).
              </p>
            )}

            {wa && (
              <a href={wa} target="_blank" rel="noreferrer"
                className="btn btn-block" style={{ marginTop: 10 }}>
                💬 Chat WhatsApp
              </a>
            )}

            {data.favorit.length > 0 && (
              <>
                <hr className="hr" />
                <div className="muted small" style={{ marginBottom: 6 }}>Menu paling sering dipesan</div>
                <div className="opt-row">
                  {data.favorit.map((f) => (
                    <span key={f.nama} className="chip">{f.nama} <b>{f.porsi}×</b></span>
                  ))}
                </div>
              </>
            )}

            <hr className="hr" />
            <div className="muted small" style={{ marginBottom: 6 }}>
              Riwayat transaksi{data.orders.length >= 20 ? ' (20 terakhir)' : ''}
            </div>

            {data.orders.length === 0 && (
              <p className="muted small" style={{ margin: 0 }}>Belum ada transaksi tercatat.</p>
            )}

            <div className="col" style={{ gap: 6 }}>
              {data.orders.map((o) => (
                <div key={o.id} className="between small"
                  style={{ borderBottom: '1px solid rgba(0,0,0,.06)', paddingBottom: 5 }}>
                  <span>
                    <b>#{o.order_no}</b> · Meja {o.table_number || '—'}
                    <span className="muted"> · {tglID(o.created_at, true)}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b>{rupiah(o.total)}</b>
                    <Link href={`/nota/${o.id}`} target="_blank" className="btn"
                      style={{ padding: '2px 8px', fontSize: 12 }}>nota</Link>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PelangganClient() {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [buka, setBuka] = useState(null);
  const [saring, setSaring] = useState(''); // '' | 'hadiah' | 'ultah'

  const muat = useCallback(async () => {
    try {
      const r = await fetch('/api/customers?semua=1');
      const d = await bacaJson(r);
      setDaftar(d.customers || []);
    } catch { setDaftar([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const tersaring = useMemo(() => {
    let l = daftar.filter((c) => cocok([c.name, c.phone], q));
    if (saring === 'hadiah') l = l.filter((c) => c.berhak_hadiah);
    if (saring === 'ultah') l = l.filter((c) => ulangTahunDalam(c.birth_date, 30));
    return l;
  }, [daftar, q, saring]);

  const ringkasan = useMemo(() => ({
    total: daftar.length,
    berhak: daftar.filter((c) => c.berhak_hadiah).length,
    ultah: daftar.filter((c) => ulangTahunDalam(c.birth_date, 7)).length,
    belanja: daftar.reduce((s, c) => s + Number(c.total_belanja || 0), 0),
  }), [daftar]);

  if (loading) return <p className="muted">Memuat…</p>;

  return (
    <div className="col">
      {buka && <Rincian id={buka} onTutup={() => { setBuka(null); muat(); }} />}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <div className="card"><div className="muted small">Pelanggan</div>
          <div className="bold" style={{ fontSize: 22 }}>{ringkasan.total}</div></div>
        <div className="card"><div className="muted small">Berhak hadiah</div>
          <div className="bold" style={{ fontSize: 22 }}>{ringkasan.berhak}</div></div>
        <div className="card"><div className="muted small">Ultah 7 hari</div>
          <div className="bold" style={{ fontSize: 22 }}>{ringkasan.ultah}</div></div>
        <div className="card"><div className="muted small">Total belanja</div>
          <div className="bold" style={{ fontSize: 18 }}>{rupiah(ringkasan.belanja)}</div></div>
      </div>

      <CariBox value={q} onChange={setQ} placeholder="Cari nama atau nomor WA…"
        hasil={tersaring.length} total={daftar.length} />

      <div className="opt-row">
        {[['', 'Semua'], ['hadiah', '🎁 Berhak hadiah'], ['ultah', '🎂 Ultah bulan ini']].map(([v, l]) => (
          <button key={v} className={`chip ${saring === v ? 'chip-on' : ''}`}
            onClick={() => setSaring(v)}>{l}</button>
        ))}
      </div>

      {tersaring.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>
          {daftar.length === 0
            ? 'Belum ada pelanggan terdaftar. Data terkumpul sendiri saat kasir input order.'
            : 'Tidak ada yang cocok.'}
        </p></div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {tersaring.map((c) => {
          const ult = ulangTahunDalam(c.birth_date, 7);
          return (
            <button key={c.id} className="card" style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setBuka(c.id)}>
              <div className="between">
                <div className="bold" style={{ fontSize: 16 }}>{c.name}</div>
                <span className="badge badge-green">{c.visit_count}×</span>
              </div>
              <div className="muted small">{c.phone}</div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {c.berhak_hadiah && <span className="badge badge-amber">🎁 hadiah</span>}
                {ult && (
                  <span className="badge badge-blue">
                    🎂 {ult.dalamHari === 0 ? 'hari ini' : `${ult.dalamHari} hari lagi`}
                  </span>
                )}
              </div>
              <hr className="hr" />
              <div className="between small">
                <span className="muted">{c.jml_bill} bill</span>
                <b>{rupiah(c.total_belanja)}</b>
              </div>
              <div className="muted small" style={{ marginTop: 2 }}>
                Terakhir: {tglID(c.terakhir_datang)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
