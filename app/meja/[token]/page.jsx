import { supabaseServer } from '../../../lib/supabaseServer';
import MejaClient from './MejaClient';

export const dynamic = 'force-dynamic';

// Halaman yang dibuka pelanggan setelah scan barcode meja.
//
// Pemesanan dilakukan kasir, jadi di sini pelanggan hanya bisa dua hal:
// memanggil waiter (dengan atau tanpa pesan permintaan) dan melihat apa saja
// yang sudah dipesan. Harga sengaja tidak ditampilkan — tagihan resmi keluar
// dari kasir, dan angka yang tampil di HP tamu sebelum bill final hanya
// memancing selisih hitung yang tidak perlu.
export default async function MejaPage({ params }) {
  const { token } = await params;
  const db = supabaseServer();

  const { data: table } = await db
    .from('tables')
    .select('id, table_number, active')
    .eq('token', token)
    .single();

  if (!table) {
    return (
      <div className="container-sm" style={{ paddingTop: 48 }}>
        <div className="card">
          <h1 className="title">QR tidak valid</h1>
          <p className="muted">
            Meja tidak ditemukan. Silakan minta bantuan staf untuk QR yang benar.
          </p>
        </div>
      </div>
    );
  }

  if (table.active === false) {
    return (
      <div className="container-sm" style={{ paddingTop: 48 }}>
        <div className="card">
          <h1 className="title">Meja tidak aktif</h1>
          <p className="muted">Meja ini sedang dinonaktifkan. Hubungi staf.</p>
        </div>
      </div>
    );
  }

  return (
    <MejaClient
      table={table}
      merchant={process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran'}
    />
  );
}
