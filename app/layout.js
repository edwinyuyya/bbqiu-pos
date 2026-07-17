import './globals.css';
import SiteFooter from './components/SiteFooter';

export const metadata = {
  title: 'BBQIU POS',
  description: 'Sistem order F&B via QR meja, bayar QRIS / kasir, dengan routing cetak dapur per station.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
