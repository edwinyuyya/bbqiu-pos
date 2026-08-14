'use client';

export default function QrPrintButton({ label = '🖨️ Cetak QR Meja' }) {
  return (
    <div className="between no-print" style={{ marginBottom: 12 }}>
      <button className="btn btn-brand" onClick={() => window.print()}>{label}</button>
      <button className="btn" onClick={() => window.history.back()}>Kembali</button>
    </div>
  );
}
