'use client';

import { useState } from 'react';

export default function BatchPrintClient({ labels, logo }) {
  const [copies, setCopies] = useState(1);
  const n = Math.max(1, Math.min(50, parseInt(copies, 10) || 1));

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      <div className="no-print" style={{ textAlign: 'center', margin: '14px 0' }}>
        <div className="row" style={{ justifyContent: 'center', marginBottom: 10 }}>
          <label className="muted small">Jumlah cetak per label
            <input
              className="input" type="number" min={1} max={50} style={{ width: 90, marginLeft: 8 }}
              value={copies} onChange={(e) => setCopies(e.target.value)}
            />
          </label>
        </div>
        <button className="btn btn-brand" onClick={() => window.print()}>🖨️ Cetak {labels.length * n} Label (58mm)</button>
      </div>

      {labels.map((l, li) =>
        Array.from({ length: n }).map((_, ci) => (
          <div key={`${li}-${ci}`} className="ticket">
            {logo}
            <div className="line" />
            <div className="bold ctr" style={{ fontSize: 14 }}>{l.name}</div>
            <div className="ctr small">Tgl: {l.date}</div>
            <div className="ctr small">Qty: {l.qty} {l.unit}</div>
            <div className="line" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.qr} alt="barcode" style={{ width: '80%', display: 'block', margin: '4px auto' }} />
            <div className="ctr small" style={{ marginTop: 4, wordBreak: 'break-all' }}>{l.batch_code}</div>
          </div>
        ))
      )}
    </div>
  );
}
