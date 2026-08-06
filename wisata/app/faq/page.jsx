import Link from 'next/link';
import { faq } from '@/data/faq';
import { site, waLink } from '@/data/site';

export const metadata = {
  title: 'Tanya Jawab',
  description:
    'Pertanyaan yang paling sering masuk: bisa berdua, bisa rombongan, ada open trip, berapa harganya, dan apa yang tidak kami layani.',
};

export default function HalamanFaq() {
  // Data terstruktur supaya pertanyaan ini bisa muncul langsung di hasil pencarian
  // Google dan dikutip asisten AI.
  const skema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.flatMap((k) =>
      k.isi.map((q) => ({
        '@type': 'Question',
        name: q.t,
        acceptedAnswer: { '@type': 'Answer', text: q.j },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skema) }}
      />

      <section className="bagian">
        <div className="bungkus">
          <span className="kop">Sebelum bertanya</span>
          <h1>Tanya Jawab</h1>
          <p className="utama">
            Ini pertanyaan yang paling sering masuk ke WhatsApp kami. Kalau yang Anda cari belum
            ada di sini, tanyakan langsung — kami tidak keberatan menjawab hal yang sama berkali-kali.
          </p>

          <div style={{ display: 'grid', gap: 46, marginTop: 44 }}>
            {faq.map((kelompok) => (
              <div key={kelompok.kelompok}>
                <h2 style={{ fontSize: '1.45rem', marginBottom: 20 }}>{kelompok.kelompok}</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {kelompok.isi.map((q) => (
                    <details
                      key={q.t}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--garis)',
                        borderRadius: 'var(--radius)',
                        padding: '16px 20px',
                      }}
                    >
                      <summary
                        style={{
                          cursor: 'pointer',
                          fontFamily: 'var(--serif)',
                          fontSize: '1.1rem',
                          color: 'var(--teks)',
                          listStyle: 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 14,
                          alignItems: 'center',
                        }}
                      >
                        {q.t}
                        <span style={{ color: 'var(--emas)', fontSize: '1.3rem', lineHeight: 1 }}>
                          +
                        </span>
                      </summary>
                      <p
                        style={{
                          color: 'var(--teks-lembut)',
                          marginTop: 14,
                          marginBottom: 0,
                          fontSize: '0.96rem',
                        }}
                      >
                        {q.j}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bagian bagian-alt">
        <div className="bungkus tengah rapat" style={{ marginInline: 'auto' }}>
          <h2>Masih ada yang mengganjal?</h2>
          <p className="utama">
            Tanyakan apa saja, termasuk hal yang mungkin Anda anggap terlalu pribadi untuk
            ditanyakan. Kami menjawab tanpa biaya dan tanpa mendesak Anda memesan.
          </p>
          <div className="tumpuk tumpuk-tengah jarak-atas">
            <a
              className="tombol tombol-wa"
              href={waLink(`Halo ${site.nama}, saya punya pertanyaan yang belum ada di halaman FAQ.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya via WhatsApp
            </a>
            <Link className="tombol tombol-garis" href="/etika">
              Baca janji &amp; etika kami
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
