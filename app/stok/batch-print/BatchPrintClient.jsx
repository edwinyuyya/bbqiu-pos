'use client';

import { useState } from 'react';

export default function BatchPrintClient({ labels }) {
  const [copies, setCopies] = useState(1);
  const n = Math.max(1, Math.min(50, parseInt(copies, 10) || 1));

  return (
    <div className="container-sm" style={{ paddingTop: 16 }}>
      {/* Ukuran label fisik 50x30mm — beda dari struk dapur/nota (58mm auto),
          jadi @page di-override khusus untuk halaman ini saja. */}
      <style>{'@media print { @page { size: 50mm 30mm; margin: 0; } }'}</style>
      <div className="no-print" style={{ textAlign: 'center', margin: '14px 0' }}>
        <div className="row" style={{ justifyContent: 'center', marginBottom: 10 }}>
          <label className="muted small">Jumlah cetak per label
            <input
              className="input" type="number" min={1} max={50} style={{ width: 90, marginLeft: 8 }}
              value={copies} onChange={(e) => setCopies(e.target.value)}
            />
          </label>
        </div>
        <button className="btn btn-brand" onClick={() => window.print()}>🖨️ Cetak {labels.length * n} Label (50x30mm)</button>
      </div>

      {labels.map((l, li) =>
        Array.from({ length: n }).map((_, ci) => (
          <div key={`${li}-${ci}`} className="label50x30">
            <div className="brand">BBQIU</div>
            <div className="row50">
              <div className="info">
                <div className="name">{l.name}</div>
                <div className="meta">Tgl: {l.date}</div>
                <div className="meta">Qty: {l.qty} {l.unit}</div>
              </div>
              <div className="qrbox">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.qr} alt="barcode" />
              </div>
            </div>
            <div className="code">{l.batch_code}</div>
          </div>
        ))
      )}
    </div>
  );
}
