import Link from 'next/link';
import PinGate from '../../components/PinGate';
import PelangganClient from './PelangganClient';

export const dynamic = 'force-dynamic';

// Daftar pelanggan + jejak transaksinya. Di balik PIN admin karena isinya
// nama, nomor WhatsApp, dan tanggal lahir — data pribadi yang tidak perlu
// terbuka untuk semua staf.
export default function PelangganPage() {
  return (
    <PinGate scope="admin" title="Masuk Admin">
      <div className="container">
        <div className="between" style={{ padding: '16px 0' }}>
          <div>
            <h1 className="title">👥 Pelanggan</h1>
            <p className="muted small">Kunjungan, riwayat transaksi, hadiah, dan ulang tahun</p>
          </div>
          <Link href="/admin" className="btn">← Admin</Link>
        </div>
        <PelangganClient />
      </div>
    </PinGate>
  );
}
