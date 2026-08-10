'use client';

import CetakTermal from '../../components/CetakTermal';
import { notaPelanggan } from '../../../lib/notaEscpos';

export default function PrintNota({ order, items, merchant, persenPajak }) {
  return (
    <CetakTermal
      judul="Cetak Nota (58mm)"
      buatStruk={() => notaPelanggan({ order, items, merchant, persenPajak })}
    />
  );
}
