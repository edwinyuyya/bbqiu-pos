'use client';

import { useState } from 'react';
import Link from 'next/link';
import Motif from '../components/Motif';
import { destinasi, labelKategori } from '@/data/destinasi';

const saringan = [
  { id: 'semua', label: 'Semua' },
  { id: 'ziarah', label: 'Ziarah' },
  { id: 'laku', label: 'Laku Spiritual' },
  { id: 'budaya', label: 'Wisata Budaya' },
  { id: 'pendakian', label: 'Pendakian' },
];

export default function DaftarDestinasi() {
  const [aktif, setAktif] = useState('semua');

  const tampil =
    aktif === 'semua' ? destinasi : destinasi.filter((d) => d.kategori.includes(aktif));

  return (
    <>
      <div className="tumpuk" style={{ marginBottom: 30 }}>
        {saringan.map((s) => {
          const dipilih = aktif === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setAktif(s.id)}
              className={`pil${dipilih ? ' pil-emas' : ''}`}
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                padding: '8px 16px',
                fontSize: '0.78rem',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="kisi kisi-3">
        {tampil.map((d) => {
          const urut = destinasi.indexOf(d);
          return (
            <Link
              key={d.slug}
              href={`/destinasi/${d.slug}`}
              className="kartu"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <Motif warna={d.warna} seed={urut} tinggi={160} label={d.kabupaten} />
              <div className="kartu-isi">
                <h3 className="kartu-judul">{d.nama}</h3>
                <div className="kartu-lokasi">{d.lokasi}</div>
                <p className="kartu-ringkas">{d.ringkas}</p>
                {d.catatan && (
                  <div
                    style={{
                      fontSize: '0.79rem',
                      color: 'var(--bata)',
                      marginBottom: 12,
                      fontWeight: 600,
                    }}
                  >
                    Ada catatan penting — baca sebelum memesan
                  </div>
                )}
                <div className="kartu-kaki">
                  <span>{d.kategori.map((k) => labelKategori[k]).join(' · ')}</span>
                  <span className="pil">{d.tingkat}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {tampil.length === 0 && (
        <p style={{ color: 'var(--teks-redup)' }}>Belum ada destinasi di kategori ini.</p>
      )}
    </>
  );
}
