// Konfigurasi seminimal mungkin, satu tujuan: menangkap variabel yang dipakai
// tapi tidak pernah didefinisikan.
//
// `next build` TIDAK menangkap ini. Pernah lolos ke produksi dua kali:
// `b.order_id` yang membuat seluruh pemesanan gagal, dan `menuHadiah` yang
// membuat tombol Buat Order mati di tengah jam ramai. Dua-duanya ketahuan
// dari layar kasir, bukan dari proses build.
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['app/**/*.{js,jsx}', 'lib/**/*.js', 'docs/**/*.mjs'],
    // Komentar eslint-disable di berkas ini menyebut aturan milik konfigurasi
    // Next yang tidak dipasang di sini; tanpa ini semuanya dilaporkan sebagai
    // "rule not found" dan menenggelamkan satu-satunya aturan yang dicari.
    linterOptions: { noInlineConfig: true },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, React: 'readonly' },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Satu-satunya yang benar-benar dijaga. Sisanya dimatikan supaya
      // pemeriksaan ini tidak berubah jadi ribuan keluhan gaya penulisan
      // yang lalu diabaikan semua orang.
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-cond-assign': 'off',
      'no-fallthrough': 'off',
      'no-prototype-builtins': 'off',
    },
  },
];
