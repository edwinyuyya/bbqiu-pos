'use client';

import { useState } from 'react';
import CetakTermal from '../../../components/CetakTermal';
import { strukDapur } from '../../../../lib/notaEscpos';

export default function PrintControls({ jobId, order, stations }) {
  const [done, setDone] = useState(false);

  // Print job ditandai selesai begitu perintah cetak dikirim, bukan setelah
  // kertas keluar — tidak ada jalur balik dari printer bluetooth yang bisa
  // memberi tahu kita cetakannya berhasil.
  async function tandaiSelesai() {
    if (!jobId || done) return;
    setDone(true);
    try { await fetch(`/api/print-jobs/${jobId}`, { method: 'PATCH' }); } catch {}
  }

  return (
    <div className="no-print">
      <CetakTermal
        judul="Cetak Struk Dapur (58mm)"
        buatStruk={() => { tandaiSelesai(); return strukDapur({ order, stations }); }}
      />
      <div className="between">
        {done && <span className="badge badge-green">Ditandai dicetak</span>}
        <button className="btn" onClick={() => window.close()}>Tutup</button>
      </div>
    </div>
  );
}
