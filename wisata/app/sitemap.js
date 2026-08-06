import { site } from '@/data/site';
import { destinasi } from '@/data/destinasi';

export default function sitemap() {
  const dasar = site.url.replace(/\/$/, '');
  const sekarang = new Date();

  const halaman = ['', '/destinasi', '/paket', '/cara-kerja', '/etika', '/faq'].map((p) => ({
    url: `${dasar}${p}`,
    lastModified: sekarang,
    changeFrequency: 'monthly',
    priority: p === '' ? 1 : 0.8,
  }));

  const lokasi = destinasi.map((d) => ({
    url: `${dasar}/destinasi/${d.slug}`,
    lastModified: sekarang,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...halaman, ...lokasi];
}
