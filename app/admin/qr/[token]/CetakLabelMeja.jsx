'use client';

import CetakTermal from '../../../components/CetakTermal';
import { strukLabelMeja } from '../../../../lib/labelMejaEscpos';

// Tombol cetak label meja ke printer termal 58mm.
//
// Matriks QR dihitung di server dan dikirim ke sini sebagai angka 0/1, supaya
// pustaka qrcode tidak ikut dibundel ke sisi pelanggan hanya untuk ini.
export default function CetakLabelMeja({ merchant, tableNumber, modul, size, link }) {
  return (
    <CetakTermal
      judul={`Cetak Label Meja ${tableNumber}`}
      buatStruk={() => strukLabelMeja({ merchant, tableNumber, modul, size, link })}
    />
  );
}
