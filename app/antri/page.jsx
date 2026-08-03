import AntriForm from './AntriForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Antrian — BBQIU' };

export default function AntriPage() {
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran';
  return (
    <div className="cust-page">
      <div className="container-sm" style={{ paddingBottom: 40 }}>
        <div className="brand-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/bbqiu-logo.png" alt="BBQIU" />
          <div className="brand-tagline">Grill · Suki · Shao Kao</div>
          <div className="brand-divider" />
        </div>
        <header style={{ padding: '4px 0 12px' }}>
          <div className="muted small">{merchant}</div>
          <h1 className="title">Antrian Meja</h1>
        </header>
        <AntriForm merchant={merchant} />
      </div>
    </div>
  );
}
