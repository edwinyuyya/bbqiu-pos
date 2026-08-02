import { headers } from 'next/headers';

// URL absolut untuk QR code. NEXT_PUBLIC_BASE_URL dipakai kalau diisi
// (mis. supaya QR selalu pakai domain custom tertentu), tapi kalau lupa
// diisi, otomatis fallback ke host request saat ini supaya QR tidak
// pernah encode path relatif (yang tidak bisa di-scan HP pelanggan).
export async function getBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : '';
}
