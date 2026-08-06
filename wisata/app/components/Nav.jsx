'use client';

import { useState } from 'react';
import Link from 'next/link';
import { site, waLink } from '@/data/site';

export default function Nav() {
  const [buka, setBuka] = useState(false);
  const tutup = () => setBuka(false);

  return (
    <nav className="nav">
      <div className="bungkus nav-isi">
        <Link href="/" className="merek" onClick={tutup}>
          <Lambang />
          {site.nama}
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setBuka((v) => !v)}
          aria-expanded={buka}
          aria-label="Buka menu"
        >
          {buka ? 'Tutup' : 'Menu'}
        </button>

        <div className={`nav-tautan${buka ? ' buka' : ''}`}>
          <Link href="/destinasi" onClick={tutup}>
            Destinasi
          </Link>
          <Link href="/paket" onClick={tutup}>
            Paket &amp; Harga
          </Link>
          <Link href="/cara-kerja" onClick={tutup}>
            Cara Kerja
          </Link>
          <Link href="/etika" onClick={tutup}>
            Janji Kami
          </Link>
          <Link href="/faq" onClick={tutup}>
            Tanya Jawab
          </Link>
          <a
            className="tombol tombol-utama"
            href={waLink(`Halo ${site.nama}, saya ingin bertanya soal paket perjalanan.`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={tutup}
          >
            Tanya via WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}

function Lambang() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" stroke="#c9a227" strokeWidth="1.4" />
      <path d="M16 3.5 A12.5 12.5 0 0 1 16 28.5 A6.25 6.25 0 0 1 16 16 A6.25 6.25 0 0 0 16 3.5Z" fill="#c9a227" />
      <circle cx="16" cy="9.7" r="1.7" fill="#0e1114" />
      <circle cx="16" cy="22.3" r="1.7" fill="#c9a227" />
    </svg>
  );
}
