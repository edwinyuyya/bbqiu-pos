-- ============================================================
--  UBAH LAYOUT MEJA JADI MEJA 1 - 18
--  Mengganti penomoran lama (Outdoor 1-4, AC 1-8, VIP 1-4, contoh
--  '1'/'2'/'VIP-1') menjadi penomoran polos: meja 1 sampai 18.
--  Jalankan di Supabase -> SQL Editor. Idempotent: aman diulang.
--
--  SESUDAH menjalankan ini, TOKEN QR meja berubah untuk meja yang baru
--  dibuat. Wajib cetak ulang stiker lewat Admin -> Cetak Semua QR Meja
--  (/admin/qr). Stiker lama akan menunjuk ke meja nonaktif dan ditolak
--  saat discan.
-- ============================================================

-- 1) Pastikan meja 1..18 ada. Meja yang nomornya sudah pas ('1','2', dst)
--    dibiarkan apa adanya supaya token & riwayatnya tidak ikut berubah.
insert into tables (table_number, token, area, active)
select gs::text,
       'meja-' || gs || '-' || substr(md5(random()::text || gs || clock_timestamp()::text), 1, 8),
       null::text,
       true
from generate_series(1, 18) as gs
on conflict (table_number) do nothing;

-- 2) Meja 1..18 yang tadinya dinonaktifkan dihidupkan lagi.
update tables set active = true
where table_number in (select gs::text from generate_series(1, 18) as gs)
  and active is distinct from true;

-- 3) Meja di luar 1..18 (Outdoor/AC/VIP/VIP-1) dinonaktifkan, bukan
--    langsung dihapus — order, panggilan waiter, antrian, dan reservasi
--    lama masih menunjuk ke baris ini lewat table_id.
update tables set active = false
where table_number not in (select gs::text from generate_series(1, 18) as gs)
  and active is distinct from false;

-- 4) Sisa meja lama yang benar-benar tidak dipakai riwayat apa pun boleh
--    dibuang supaya layar Kelola Meja bersih. Yang masih terpakai tetap
--    tinggal sebagai meja nonaktif.
delete from tables t
where t.table_number not in (select gs::text from generate_series(1, 18) as gs)
  and not exists (select 1 from orders       o where o.table_id = t.id)
  and not exists (select 1 from waiter_calls w where w.table_id = t.id)
  and not exists (select 1 from waiting_list q where q.table_id = t.id)
  and not exists (select 1 from reservations r where r.table_id = t.id);

-- 5) Hasil akhir — harus 18 baris, nomor 1 sampai 18.
select table_number, area, seats, active, token
from tables
where active = true
order by table_number::int;
