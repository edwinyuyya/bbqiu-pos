'use client';

import CetakTermal from '../../components/CetakTermal';
import { strukLabelMejaBanyak } from '../../../lib/labelMejaEscpos';

// Cetak label semua meja sekaligus ke printer termal 58mm, dalam satu kiriman.
export default function CetakSemuaLabel({ merchant, labels }) {
  return (
    <CetakTermal
      judul={`Cetak ${labels.length} Label Meja`}
      buatStruk={() => strukLabelMejaBanyak(labels, merchant)}
    />
  );
}
