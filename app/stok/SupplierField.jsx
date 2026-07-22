'use client';

import { useMemo } from 'react';

// Field supplier dengan autocomplete dari daftar terdaftar.
// Kalau nama yang diketik TIDAK ada di daftar -> anggap "custom/dadakan",
// wajib isi No. Nota Pembelian sebagai verifikasi.
export default function SupplierField({ suppliers, value, invoiceNo, onChangeSupplier, onChangeInvoice }) {
  const names = useMemo(() => suppliers.map((s) => s.name), [suppliers]);
  const isCustom = value && value.trim() && !names.some((n) => n.toLowerCase() === value.trim().toLowerCase());
  return (
    <div className="col" style={{ gap: 6 }}>
      <input
        className="input" placeholder="Supplier (ketik atau pilih dari daftar)"
        list="supplier-suggestions" value={value || ''}
        onChange={(e) => onChangeSupplier(e.target.value)}
      />
      <datalist id="supplier-suggestions">
        {names.map((n) => <option key={n} value={n} />)}
      </datalist>
      {isCustom && (
        <div className="card" style={{ padding: '8px 10px', borderColor: 'var(--red)' }}>
          <div className="small" style={{ color: '#ff8585', marginBottom: 4 }}>
            ⚠️ Supplier belum terdaftar (dadakan) — wajib isi No. Nota untuk verifikasi.
          </div>
          <input
            className="input" placeholder="No. Nota Pembelian *"
            value={invoiceNo || ''} onChange={(e) => onChangeInvoice(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
