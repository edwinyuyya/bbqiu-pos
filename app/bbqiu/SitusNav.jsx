'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND, waLink } from '../../lib/situs';

const LINKS = [
  ['/bbqiu', 'Beranda'],
  ['/bbqiu/tentang', 'Tentang'],
  ['/bbqiu/menu', 'Menu'],
  ['/bbqiu/produk', 'Produk'],
  ['/bbqiu/kemitraan', 'Peluang Kerjasama'],
  ['/bbqiu/kontak', 'Kontak'],
];

export default function SitusNav() {
  const [buka, setBuka] = useState(false);
  const path = usePathname();

  return (
    <header className="s-nav">
      <div className="s-wrap s-nav-in" style={{ position: 'relative' }}>
        <Link href="/bbqiu" className="s-logo" onClick={() => setBuka(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bbqiu-logo.png" alt="BBQIU" />
        </Link>

        <button
          className="s-nav-toggle"
          onClick={() => setBuka((v) => !v)}
          aria-expanded={buka}
          aria-label="Buka menu navigasi"
        >
          {buka ? '✕' : '☰'}
        </button>

        <nav className={`s-nav-links${buka ? ' open' : ''}`}>
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? 'on' : ''}
              onClick={() => setBuka(false)}
            >
              {label}
            </Link>
          ))}
          <a
            className="s-btn s-btn-primary s-btn-sm"
            href={waLink(`Halo ${BRAND.nama}, saya mau tanya-tanya dulu.`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setBuka(false)}
          >
            Chat WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
