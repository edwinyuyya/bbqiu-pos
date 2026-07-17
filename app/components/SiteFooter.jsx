// Footer global. Ganti <NexoraMark/> dengan file logo asli bila sudah ada
// (mis. <img src="/nexora-logo.png" .../>).
function NexoraMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="nx-g" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#e0552c" />
          <stop offset="1" stopColor="#d99411" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#nx-g)" />
      <path d="M7 17V7l10 10V7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
