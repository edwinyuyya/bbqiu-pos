import './globals.css';
import Nav from './components/Nav';
import Footer from './components/Footer';
import { site } from '@/data/site';

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nama} — ${site.tagline}`,
    template: `%s · ${site.nama}`,
  },
  description: site.deskripsi,
  keywords: [
    'wisata spiritual',
    'ziarah jawa',
    'tour ziarah jogja',
    'wisata budaya yogyakarta',
    'open trip ziarah',
    'paket ziarah jawa tengah',
  ],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: site.nama,
    title: `${site.nama} — ${site.tagline}`,
    description: site.deskripsi,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#0e1114',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
