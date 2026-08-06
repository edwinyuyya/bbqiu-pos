import { site } from '@/data/site';

export default function robots() {
  const dasar = site.url.replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${dasar}/sitemap.xml`,
  };
}
