// Motif pengganti foto.
// Selama folder `foto` sebuah destinasi masih kosong, komponen ini menggambar
// pola bergaya batik kawung/parang dari warna destinasi tersebut, supaya
// halaman tetap terlihat utuh sebelum Anda sempat memotret lokasi.

export default function Motif({ warna = '#2f4858', seed = 0, tinggi = 200, label }) {
  const id = `motif-${seed}`;
  // Tiga varian pola supaya tiap destinasi tidak terlihat kembar.
  const varian = seed % 3;

  return (
    <div
      style={{
        position: 'relative',
        height: tinggi,
        background: warna,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
            {varian === 0 && (
              <>
                <circle cx="20" cy="20" r="13" fill="none" stroke="rgba(201,162,39,0.34)" strokeWidth="1.1" />
                <circle cx="0" cy="0" r="13" fill="none" stroke="rgba(201,162,39,0.34)" strokeWidth="1.1" />
                <circle cx="40" cy="40" r="13" fill="none" stroke="rgba(201,162,39,0.34)" strokeWidth="1.1" />
                <circle cx="0" cy="40" r="13" fill="none" stroke="rgba(201,162,39,0.34)" strokeWidth="1.1" />
                <circle cx="40" cy="0" r="13" fill="none" stroke="rgba(201,162,39,0.34)" strokeWidth="1.1" />
                <circle cx="20" cy="20" r="3" fill="rgba(201,162,39,0.28)" />
              </>
            )}
            {varian === 1 && (
              <>
                <path
                  d="M-6 34 L34 -6 M6 46 L46 6 M-18 22 L22 -18"
                  stroke="rgba(201,162,39,0.3)"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="14" cy="14" r="2.6" fill="rgba(201,162,39,0.3)" />
                <circle cx="32" cy="32" r="2.6" fill="rgba(201,162,39,0.3)" />
              </>
            )}
            {varian === 2 && (
              <>
                <path
                  d="M20 5 Q31 20 20 35 Q9 20 20 5 Z"
                  fill="none"
                  stroke="rgba(201,162,39,0.32)"
                  strokeWidth="1.2"
                />
                <path d="M0 20 H6 M34 20 H40" stroke="rgba(201,162,39,0.22)" strokeWidth="1.2" />
                <circle cx="20" cy="20" r="2.2" fill="rgba(201,162,39,0.3)" />
              </>
            )}
          </pattern>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill={warna} />
        <rect width="400" height="200" fill={`url(#${id})`} />
        <rect width="400" height="200" fill={`url(#${id}-fade)`} />
      </svg>

      {label && (
        <span
          style={{
            position: 'absolute',
            left: 14,
            bottom: 12,
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(233,230,223,0.55)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
