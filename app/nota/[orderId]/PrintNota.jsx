'use client';

export default function PrintNota() {
  return (
    <div className="no-print" style={{ textAlign: 'center', margin: '14px 0' }}>
      <button className="btn btn-brand" onClick={() => window.print()}>🖨️ Cetak Nota (58mm)</button>
    </div>
  );
}
