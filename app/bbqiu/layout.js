import './situs.css';
import SitusNav from './SitusNav';
import SitusFooter from './SitusFooter';
import { BRAND } from '../../lib/situs';

export const metadata = {
  title: {
    default: `${BRAND.nama} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.nama}`,
  },
  description: BRAND.deskripsi,
  openGraph: {
    title: `${BRAND.nama} — ${BRAND.tagline}`,
    description: BRAND.deskripsi,
    type: 'website',
  },
};

export default function SitusLayout({ children }) {
  return (
    <div className="situs">
      <SitusNav />
      {children}
      <SitusFooter />
    </div>
  );
}
