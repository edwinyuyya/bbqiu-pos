// Rekreasi vektor logo BBQIU (mahkota di huruf Q + tagline) supaya tajam
// di semua ukuran, termasuk struk thermal 58mm. Ganti dengan <img> ke file
// logo asli bila sudah tersedia sebagai file (bukan sekadar tempel di chat).
export default function BbqiuLogoMark({ width = 170, withTagline = true }) {
  return (
    <svg
      viewBox="0 0 420 190"
      width={width}
      style={{ display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="BBQIU"
    >
      <text x="0" y="120" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="108" fill="#111">BB</text>
      <text x="326" y="120" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="108" fill="#111">IU</text>
      <g>
        <path
          d="M175 35 q3 -20 12 -20 q4 0 6 8 q6 -14 14 -14 q6 0 4 12 q9 -10 15 -6 q5 3 -1 12 q10 -6 13 2 q3 8 -8 12 q-27 12 -55 0 q-9 -3 0 -6z"
          fill="#e21b1b"
        />
        <path d="M204 30 l4 -16 l5 10 l6 -12 l4 12 l6 -9 l3 15 z" fill="#e21b1b" />
        <path
          d="M231 55
             c34 0 52 24 52 55
             c0 34 -24 62 -58 68
             c14 10 28 14 40 12
             c4 -1 6 4 2 6
             c-16 8 -36 3 -50 -8
             c-26 -4 -46 -30 -46 -74
             c0 -35 22 -59 60 -59 z"
          fill="#e21b1b"
        />
        <path
          d="M231 55 c34 0 52 24 52 55 c0 34 -24 62 -58 68 c-30 -8 -48 -33 -48 -68 c0 -35 22 -59 60 -59 z"
          fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"
        />
      </g>
      {withTagline && (
        <text x="210" y="168" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="20" fill="#111" letterSpacing="1">
          ★ GRILL TOGETHER, SMILE FOREVER ★
        </text>
      )}
    </svg>
  );
}
