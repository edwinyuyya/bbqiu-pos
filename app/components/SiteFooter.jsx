// Footer global. Rekreasi vektor logo Nexora (3 bar ungu + wordmark) supaya
// tajam di semua ukuran. Ganti dengan <img> ke file logo asli bila sudah
// tersedia sebagai file (bukan sekadar tempel di chat).
function NexoraMark({ height = 18 }) {
  return (
    <svg height={height} viewBox="0 0 40 32" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="4" y="0" width="32" height="8" rx="4" fill="#d9c9f5" />
      <rect x="2" y="12" width="34" height="8" rx="4" fill="#9b6fe0" />
      <rect x="0" y="24" width="36" height="8" rx="4" fill="#6c2bd9" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div>Developed by</div>
      <div className="nx"><NexoraMark /> NEXORA</div>
    </footer>
  );
}
