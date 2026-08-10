-- ============================================================
--  F&B Ordering System - Skema Database (Supabase / Postgres)
--  Jalankan di Supabase -> SQL Editor -> New Query
-- ============================================================

-- Bersihkan jika ingin reset (hati-hati di produksi)
-- drop table if exists print_jobs, order_items, orders, menu_items, categories, tables, stations cascade;

-- ---------- STATION (dapur & bar) ----------
create table if not exists stations (
  id          text primary key,        -- 'shaokao' | 'maincourse' | 'bar'
  name        text not null,
  sort_order  int  default 0
);

-- ---------- MEJA ----------
create table if not exists tables (
  id           uuid default gen_random_uuid() primary key,
  table_number text not null unique,    -- nomor / nama meja, mis. "12", "VIP-1"
  token        text not null unique,    -- token unik untuk QR di meja
  area         text,                    -- area/ruangan, mis. "Outdoor", "Ruang AC", "VIP"
  seats        int,                     -- kapasitas kursi (dipakai sistem antrian)
  active       boolean default true,
  created_at   timestamptz default now()
);
alter table tables add column if not exists area text;
alter table tables add column if not exists seats int;

-- ---------- KATEGORI MENU ----------
create table if not exists categories (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  station_id  text references stations(id),  -- default station utk item di kategori ini
  sort_order  int  default 0
);

-- ---------- MENU ----------
create table if not exists menu_items (
  id           uuid default gen_random_uuid() primary key,
  category_id  uuid references categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric not null default 0,
  station_id   text references stations(id),  -- override station (opsional)
  image_url    text,                            -- foto menu (data URL / URL)
  daily_qty    integer,                         -- sisa porsi hari ini (null = tak terbatas)
  available    boolean default true,
  sort_order   int default 0,
  created_at   timestamptz default now()
);
alter table menu_items add column if not exists image_url text;
alter table menu_items add column if not exists daily_qty integer;
-- true = pelanggan wajib pilih cara masak (Grill / Steamboat) saat pesan
alter table menu_items add column if not exists needs_cook_method boolean default false;
-- true = pelanggan wajib pilih suhu (Es/Panas) + tingkat manis (Mondo/Manis/Tawar)
alter table menu_items add column if not exists needs_drink_option boolean default false;
-- true = digoreng dulu sebelum dibakar. Dikerjakan di station yang SAMA
-- (shaokao), jadi ini keterangan proses, bukan perpindahan station.
-- Sayur & jamur umumnya false; jamur enoki dikecualikan (true).
alter table menu_items add column if not exists needs_fry_first boolean default false;
-- diskon melekat pada menu, diatur admin (null/0 = tanpa diskon)
alter table menu_items add column if not exists discount_percent numeric;

-- ---------- ORDER (bill per meja) ----------
create table if not exists orders (
  id             uuid default gen_random_uuid() primary key,
  order_no       serial,
  table_id       uuid references tables(id),
  table_number   text,
  status         text default 'open',      -- open | preparing | served | closed | cancelled
  payment_method text,                      -- 'qris' | 'cashier'
  payment_status text default 'unpaid',     -- unpaid | paid
  subtotal       numeric default 0,
  tax            numeric default 0,
  total          numeric default 0,
  customer_name  text,
  note           text,
  created_at     timestamptz default now(),
  paid_at        timestamptz,
  closed_at      timestamptz,
  cancelled_at   timestamptz,               -- waktu pembatalan (void)
  void_reason    text,                       -- alasan pembatalan
  voided_by      text,                       -- nama/inisial petugas yang membatalkan
  void_photo     text,                       -- foto wajah petugas saat void (data URL)
  customer_claimed_paid boolean default false, -- pelanggan klaim sudah bayar (BELUM tentu Lunas resmi)
  claimed_paid_at timestamptz                -- waktu klaim, untuk kasir verifikasi manual
);

-- untuk database yang sudah ada (aman dijalankan ulang):
alter table orders add column if not exists cancelled_at timestamptz;
alter table orders add column if not exists void_reason text;
alter table orders add column if not exists voided_by text;
alter table orders add column if not exists void_photo text;
alter table orders add column if not exists customer_claimed_paid boolean default false;
alter table orders add column if not exists claimed_paid_at timestamptz;

-- ---------- ITEM PADA ORDER ----------
create table if not exists order_items (
  id             uuid default gen_random_uuid() primary key,
  order_id       uuid references orders(id) on delete cascade,
  menu_item_id   uuid references menu_items(id),
  name           text not null,
  price          numeric not null,
  qty            int not null default 1,
  note           text,
  station_id     text references stations(id),   -- station tujuan cetak
  kitchen_status text default 'queued',          -- queued | printed | preparing | ready | served
  cook_method    text,                            -- 'grill' | 'steamboat' (menu Grill & Steamboat)
  drink_temp     text,                            -- 'es' | 'panas' (menu minuman)
  sweetness      text,                            -- 'mondo' | 'manis' | 'tawar' (menu minuman)
  created_at     timestamptz default now()
);
alter table order_items add column if not exists cook_method text;
alter table order_items add column if not exists drink_temp text;   -- 'es' | 'panas'
alter table order_items add column if not exists sweetness  text;   -- 'mondo' | 'manis' | 'tawar'
alter table order_items add column if not exists stage text;   -- warisan alur 2-station, tidak dipakai lagi
-- snapshot proses & kategori saat dipesan, supaya struk lama tetap benar
-- walau menunya nanti diubah atau dipindah kategori
alter table order_items add column if not exists fry_first boolean default false;
alter table order_items add column if not exists category_name text;
-- pembatalan PER ITEM (mis. bahan habis), terpisah dari void seluruh bill
alter table order_items add column if not exists cancelled_at  timestamptz;
alter table order_items add column if not exists cancel_reason text;
alter table order_items add column if not exists cancelled_by  text;
create index if not exists idx_orderitems_cancelled on order_items(order_id, cancelled_at);
alter table order_items add column if not exists discount      numeric default 0;
alter table order_items add column if not exists discount_note text;
-- gelombang pemesanan: 1 = pesanan awal, 2+ = tambahan dari meja yang sama.
-- Struk dapur hanya mencetak gelombang yang bersangkutan supaya masakan
-- lama tidak dibuat ulang.
alter table order_items add column if not exists batch_no int default 1;
alter table print_jobs  add column if not exists batch_no int;

-- ---------- ANTRIAN CETAK DAPUR ----------
create table if not exists print_jobs (
  id         uuid default gen_random_uuid() primary key,
  order_id   uuid references orders(id) on delete cascade,
  status     text default 'pending',   -- pending | printed
  created_at timestamptz default now(),
  printed_at timestamptz
);

-- ---------- INDEX ----------
create index if not exists idx_orders_status   on orders(status);
create index if not exists idx_order_items_ord on order_items(order_id);
create index if not exists idx_order_items_st  on order_items(station_id, kitchen_status);
create index if not exists idx_print_jobs_st   on print_jobs(status, created_at);

-- ============================================================
--  RLS (allow-all utk MVP; perketat utk produksi)
-- ============================================================
alter table stations    enable row level security;
alter table tables      enable row level security;
alter table categories  enable row level security;
alter table menu_items  enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table print_jobs  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['stations','tables','categories','menu_items','orders','order_items','print_jobs']
  loop
    execute format('drop policy if exists "allow all %1$s" on %1$s;', t);
    execute format('create policy "allow all %1$s" on %1$s for all using (true) with check (true);', t);
  end loop;
end $$;

-- Beri izin akses ke role Data API (anon & authenticated).
-- WAJIB: tanpa GRANT ini, PostgREST menyembunyikan tabel -> error 404.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select, update on all sequences in schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select, update on sequences to anon, authenticated;
notify pgrst, 'reload schema';

-- ============================================================
--  SEED DATA (3 station + contoh menu)
-- ============================================================
insert into stations (id, name, sort_order) values
  ('shaokao',    'Station Shaokao',    1),
  ('maincourse', 'Station Maincourse', 2),
  ('bar',        'Bar Minuman',        3)
on conflict (id) do nothing;

-- Kategori
insert into categories (name, station_id, sort_order) values
  ('Shaokao (Sate Bakar)', 'shaokao',    1),
  ('Main Course',          'maincourse', 2),
  ('Minuman',              'bar',        3)
on conflict do nothing;

-- Contoh menu (ambil category_id dinamis)
insert into menu_items (category_id, name, description, price, station_id, sort_order)
select c.id, m.name, m.description, m.price, c.station_id, m.sort_order
from (values
  ('Shaokao (Sate Bakar)', 'Sate Daging Sapi',   'Tusuk sapi bumbu cumin',          15000, 1),
  ('Shaokao (Sate Bakar)', 'Sate Ayam Pedas',    'Tusuk ayam saus pedas',           12000, 2),
  ('Shaokao (Sate Bakar)', 'Sate Jamur Enoki',   'Enoki bakar bumbu shaokao',       10000, 3),
  ('Main Course',          'Nasi Goreng Spesial','Nasi goreng + telur + ayam',      28000, 1),
  ('Main Course',          'Mie Goreng Seafood', 'Mie goreng udang & cumi',         32000, 2),
  ('Main Course',          'Ayam Kungpao + Nasi','Ayam kungpao pedas manis',        30000, 3),
  ('Minuman',              'Es Teh Manis',       'Teh manis dingin',                 8000, 1),
  ('Minuman',              'Es Jeruk',           'Jeruk peras segar',               12000, 2),
  ('Minuman',              'Lemon Tea',          'Teh lemon dingin',                14000, 3)
) as m(cat, name, description, price, sort_order)
join categories c on c.name = m.cat
on conflict do nothing;

-- Contoh meja
insert into tables (table_number, token) values
  ('1',  'meja-1-' || substr(md5(random()::text),1,8)),
  ('2',  'meja-2-' || substr(md5(random()::text),1,8)),
  ('VIP-1', 'meja-vip1-' || substr(md5(random()::text),1,8))
on conflict (table_number) do nothing;

-- Layout meja BBQIU: 4 Outdoor, 8 Ruang AC, 4 VIP
insert into tables (table_number, token, area)
select 'Outdoor ' || gs, 'meja-outdoor-' || substr(md5(random()::text || gs || clock_timestamp()::text), 1, 8), 'Outdoor'
from generate_series(1, 4) as gs
on conflict (table_number) do nothing;

insert into tables (table_number, token, area)
select 'AC ' || gs, 'meja-ac-' || substr(md5(random()::text || gs || clock_timestamp()::text), 1, 8), 'Ruang AC'
from generate_series(1, 8) as gs
on conflict (table_number) do nothing;

insert into tables (table_number, token, area)
select 'VIP ' || gs, 'meja-vip-' || substr(md5(random()::text || gs || clock_timestamp()::text), 1, 8), 'VIP'
from generate_series(1, 4) as gs
on conflict (table_number) do nothing;

-- ============================================================
--  INVENTORY / STOK & BELANJA BARANG
-- ============================================================
create table if not exists inventory_items (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  unit        text default 'pcs',        -- satuan: pcs | kg | gram | pack | liter | ikat
  category    text,                       -- mis. Daging, Sayur, Bumbu, Minuman
  stock_qty   numeric default 0,
  min_stock   numeric default 0,          -- ambang stok menipis
  cost_price  numeric default 0,          -- harga beli per satuan
  supplier    text,
  barcode     text,                        -- opsional (untuk scan)
  expiry_date date,                         -- tanggal kadaluarsa (jika diketahui)
  received_date date,                       -- tanggal barang datang / beli
  shelf_life_days numeric,                  -- override masa simpan (hari); kosong = estimasi otomatis
  created_at  timestamptz default now()
);

-- untuk database yang sudah ada (jalankan ulang aman):
alter table inventory_items add column if not exists expiry_date date;
alter table inventory_items add column if not exists received_date date;
alter table inventory_items add column if not exists shelf_life_days numeric;

create table if not exists stock_movements (
  id          uuid default gen_random_uuid() primary key,
  item_id     uuid references inventory_items(id) on delete cascade,
  type        text default 'in',          -- in (barang datang) | out (pemakaian) | adjust (opname)
  qty         numeric not null,
  cost        numeric default 0,          -- nilai belanja (qty * harga beli) untuk tipe 'in'
  note        text,
  created_at  timestamptz default now()
);

create index if not exists idx_inv_barcode on inventory_items(barcode);
create index if not exists idx_stockmov_item on stock_movements(item_id, created_at);
create index if not exists idx_stockmov_date on stock_movements(created_at);

alter table inventory_items enable row level security;
alter table stock_movements enable row level security;
do $$
declare t text;
begin
  foreach t in array array['inventory_items','stock_movements']
  loop
    execute format('drop policy if exists "allow all %1$s" on %1$s;', t);
    execute format('create policy "allow all %1$s" on %1$s for all using (true) with check (true);', t);
  end loop;
end $$;

-- contoh barang (boleh dihapus)
insert into inventory_items (name, unit, category, stock_qty, min_stock, cost_price, supplier) values
  ('Daging Sapi Slice', 'kg', 'Daging', 0, 5, 120000, 'Supplier A'),
  ('Ayam Fillet', 'kg', 'Daging', 0, 5, 35000, 'Supplier A'),
  ('Jamur Enoki', 'pack', 'Sayur', 0, 10, 6000, 'Pasar'),
  ('Tusuk Sate', 'pack', 'Lainnya', 0, 5, 15000, 'Toko Plastik'),
  ('Arang', 'kg', 'Lainnya', 0, 10, 12000, 'Supplier B')
on conflict do nothing;

-- ============================================================
--  PENUTUPAN KASIR / AKHIR SHIFT (dengan foto wajah - keamanan)
-- ============================================================
create table if not exists cashier_closures (
  id          uuid default gen_random_uuid() primary key,
  closed_by   text,                  -- nama/inisial kasir
  cash_total  numeric,               -- total uang kas di laci (opsional)
  note        text,
  photo       text,                  -- foto wajah kasir saat tutup (data URL)
  created_at  timestamptz default now()
);
create index if not exists idx_closures_date on cashier_closures(created_at);

alter table cashier_closures enable row level security;
drop policy if exists "allow all cashier_closures" on cashier_closures;
create policy "allow all cashier_closures" on cashier_closures for all using (true) with check (true);

-- Pastikan tabel baru punya izin Data API + refresh sekali lagi.
grant select, insert, update, delete on inventory_items, stock_movements, cashier_closures to anon, authenticated;
notify pgrst, 'reload schema';

-- ============================================================
--  SUPPLIER (daftar terdaftar) + verifikasi nota utk custom
-- ============================================================
create table if not exists suppliers (
  id          uuid default gen_random_uuid() primary key,
  name        text not null unique,
  contact     text,
  created_at  timestamptz default now()
);

-- Kolom verifikasi di inventory_items utk supplier di luar daftar (dadakan)
alter table inventory_items add column if not exists supplier_verified boolean default true;
alter table inventory_items add column if not exists invoice_no text;

alter table suppliers enable row level security;
drop policy if exists "allow all suppliers" on suppliers;
create policy "allow all suppliers" on suppliers for all using (true) with check (true);

-- ============================================================
--  PETTY CASH (kas kecil kasir) - verifikasi nota via foto
-- ============================================================
create table if not exists petty_cash (
  id          uuid default gen_random_uuid() primary key,
  type        text not null,             -- 'in' (isi ulang) | 'out' (pengeluaran)
  amount      numeric not null,
  note        text,
  photo       text,                       -- foto nota bukti (wajib utk 'out')
  created_by  text,
  created_at  timestamptz default now()
);
create index if not exists idx_pettycash_date on petty_cash(created_at);

alter table petty_cash enable row level security;
drop policy if exists "allow all petty_cash" on petty_cash;
create policy "allow all petty_cash" on petty_cash for all using (true) with check (true);

grant select, insert, update, delete on suppliers, petty_cash to anon, authenticated;
notify pgrst, 'reload schema';

-- ============================================================
--  RESEP / BOM (Bill of Materials) - potong stok bahan otomatis
-- ============================================================
create table if not exists recipe_items (
  id                 uuid default gen_random_uuid() primary key,
  menu_item_id       uuid references menu_items(id) on delete cascade,
  inventory_item_id  uuid references inventory_items(id) on delete cascade,
  qty                numeric not null default 0,  -- kebutuhan bahan per 1 porsi menu (satuan ikut inventory_item.unit)
  created_at         timestamptz default now()
);
create index if not exists idx_recipe_menu on recipe_items(menu_item_id);

alter table recipe_items enable row level security;
drop policy if exists "allow all recipe_items" on recipe_items;
create policy "allow all recipe_items" on recipe_items for all using (true) with check (true);

grant select, insert, update, delete on recipe_items to anon, authenticated;
notify pgrst, 'reload schema';

-- ============================================================
--  PANGGIL WAITER (tombol pelanggan minta bantuan staf)
-- ============================================================
create table if not exists waiter_calls (
  id            uuid default gen_random_uuid() primary key,
  table_id      uuid references tables(id),
  table_number  text,
  reason        text,                       -- alasan singkat (opsional)
  status        text not null default 'pending', -- pending | handled
  handled_by    text,
  created_at    timestamptz default now(),
  handled_at    timestamptz
);
create index if not exists idx_waitercalls_status on waiter_calls(status, created_at);

alter table waiter_calls enable row level security;
drop policy if exists "allow all waiter_calls" on waiter_calls;
create policy "allow all waiter_calls" on waiter_calls for all using (true) with check (true);

grant select, insert, update, delete on waiter_calls to anon, authenticated;
notify pgrst, 'reload schema';

-- ============================================================
--  ANTRIAN TUNGGU (walk-in waiting list)
-- ============================================================
create table if not exists waiting_list (
  id            uuid default gen_random_uuid() primary key,
  queue_date    date not null default (now() at time zone 'Asia/Jakarta')::date,
  queue_no      int  not null,                    -- nomor antrian, reset tiap hari (WIB)
  customer_name text not null,
  phone         text,
  party_size    int  not null default 2,
  area_pref     text,                             -- null = area bebas
  note          text,
  status        text not null default 'waiting',  -- waiting | called | seated | no_show | cancelled
  table_id      uuid references tables(id),       -- meja yang diberikan saat dipanggil
  device_key    text,                             -- kenali scan ulang dari HP yang sama
  created_at    timestamptz default now(),
  called_at     timestamptz,
  seated_at     timestamptz,
  closed_at     timestamptz
);
create index if not exists idx_waitinglist_status on waiting_list(status, created_at);
create index if not exists idx_waitinglist_device on waiting_list(device_key, status);
-- penjaga sebenarnya kalau dua orang mendaftar bersamaan
create unique index if not exists idx_waitinglist_no on waiting_list(queue_date, queue_no);

alter table waiting_list enable row level security;
drop policy if exists "allow all waiting_list" on waiting_list;
create policy "allow all waiting_list" on waiting_list for all using (true) with check (true);

grant select, insert, update, delete on waiting_list to anon, authenticated;
notify pgrst, 'reload schema';

-- ============================================================
--  LOG KINERJA DAPUR (timer per order: masuk -> diklik selesai)
-- ============================================================
create table if not exists kitchen_perf_log (
  id            uuid default gen_random_uuid() primary key,
  order_id      uuid references orders(id),
  order_no      text,
  table_number  text,
  started_at    timestamptz not null,   -- orders.created_at
  completed_at  timestamptz not null default now(),
  duration_sec  integer not null,
  item_count    integer,
  created_at    timestamptz default now()
);
create index if not exists idx_kitchenperf_completed on kitchen_perf_log(completed_at);

alter table kitchen_perf_log enable row level security;
drop policy if exists "allow all kitchen_perf_log" on kitchen_perf_log;
create policy "allow all kitchen_perf_log" on kitchen_perf_log for all using (true) with check (true);

grant select, insert, update, delete on kitchen_perf_log to anon, authenticated;
notify pgrst, 'reload schema';


-- ============================================================
--  PROMO / DISKON (kode dipasang kasir sebelum pembayaran)
-- ============================================================
create table if not exists promos (
  id          uuid default gen_random_uuid() primary key,
  code        text not null,
  name        text not null,                 -- keterangan untuk staf
  percent     numeric not null,              -- 0-100
  -- 'all' | 'categories' | 'except_categories'
  scope       text not null default 'all',
  scope_category_ids uuid[] default '{}',
  valid_from  date,                          -- null = tanpa batas awal
  valid_until date,                          -- null = sampai dibatalkan manual
  active      boolean default true,
  used_count  int default 0,
  created_at  timestamptz default now()
);
-- kode unik tanpa peduli huruf besar/kecil
create unique index if not exists idx_promos_code on promos (lower(code));
create index if not exists idx_promos_active on promos (active, valid_until);

-- Diskon yang dipakai disimpan di order supaya nota & laporan lama tetap
-- benar walau promonya kemudian diubah atau dihapus.
alter table orders add column if not exists promo_code text;
alter table orders add column if not exists promo_id   uuid references promos(id);
alter table orders add column if not exists discount   numeric default 0;

alter table promos enable row level security;
drop policy if exists "allow all promos" on promos;
create policy "allow all promos" on promos for all using (true) with check (true);
grant select, insert, update, delete on promos to anon, authenticated;
notify pgrst, 'reload schema';


-- ============================================================
--  RESERVASI + PRA-PESANAN
-- ============================================================
-- Reservasi TIDAK memblokir meja. Keterisian meja dihitung dari bill yang
-- sedang berjalan, jadi meja yang dijanjikan tetap bebas dipakai tamu lain
-- sampai reservasinya benar-benar datang. table_id di sini hanya RENCANA.
create table if not exists reservations (
  id             uuid default gen_random_uuid() primary key,
  token          text not null unique,        -- untuk QR/link yang dikirim ke tamu
  customer_name  text not null,
  phone          text,
  party_size     int not null default 2,
  reserved_date  date not null,
  reserved_time  time,
  table_id       uuid references tables(id),  -- rencana meja (boleh kosong/diganti)
  area_pref      text,
  status         text not null default 'booked', -- booked | seated | cancelled | no_show
  deposit_amount numeric default 0,           -- DP yang sudah diterima
  deposit_note   text,
  deposit_at     timestamptz,
  note           text,
  created_by     text,
  created_at     timestamptz default now(),
  seated_at      timestamptz,
  closed_at      timestamptz
);
create index if not exists idx_reservations_date on reservations(reserved_date, status);

-- Pra-pesanan = order berstatus 'scheduled'. Status ini sengaja di luar
-- daftar yang dipakai dapur/kasir/laporan (semuanya memfilter
-- open/preparing/served), jadi tidak dimasak, tidak ditagih, dan tidak
-- menggelembungkan angka penjualan sebelum tamunya datang.
alter table orders add column if not exists reservation_id uuid references reservations(id);
-- pembayaran bertahap: DP dulu, sisanya saat datang
alter table orders add column if not exists paid_amount numeric default 0;
-- Izin khusus supaya dapur boleh mengerjakan bill yang BELUM lunas
-- (dipakai reservasi ber-DP: tamunya sudah bayar muka dan sudah duduk).
-- Sengaja kolom terpisah, BUKAN menandai payment_status='paid' -- menandai
-- lunas padahal uangnya belum penuh akan merusak laporan penjualan dan
-- membuat sisa tagihan hilang dari kasir.
alter table orders add column if not exists kitchen_released boolean default false;
create index if not exists idx_orders_reservation on orders(reservation_id);

alter table reservations enable row level security;
drop policy if exists "allow all reservations" on reservations;
create policy "allow all reservations" on reservations for all using (true) with check (true);
grant select, insert, update, delete on reservations to anon, authenticated;
notify pgrst, 'reload schema';


-- ============================================================
--  RESEP PRODUKSI (bahan mentah -> bahan siap pakai)
-- ============================================================
-- Sistem batch/label & barcode DIHAPUS: stok cukup dicatat sebagai angka.
--   drop table if exists stock_batches cascade;
--   alter table inventory_items drop column if exists batch_tracked;
--   alter table inventory_items drop column if exists barcode;
--
-- Produksi mengubah bahan mentah jadi bahan siap pakai dalam SATU langkah:
-- stok hasil bertambah, bahan mentahnya berkurang. Sebelumnya dua tindakan
-- terpisah dan yang kedua hampir selalu terlewat, sehingga bahan tercatat
-- dua kali.
create table if not exists production_recipes (
  id             uuid default gen_random_uuid() primary key,
  output_item_id uuid not null references inventory_items(id) on delete cascade,
  input_item_id  uuid not null references inventory_items(id) on delete cascade,
  qty            numeric not null default 1,  -- input per 1 satuan output
                                              -- >1 menampung susut potong
  created_at     timestamptz default now()
);
create unique index if not exists idx_prodrecipe_pair
  on production_recipes(output_item_id, input_item_id);
create index if not exists idx_prodrecipe_out on production_recipes(output_item_id);

alter table production_recipes enable row level security;
drop policy if exists "allow all production_recipes" on production_recipes;
create policy "allow all production_recipes" on production_recipes for all using (true) with check (true);
grant select, insert, update, delete on production_recipes to anon, authenticated;
notify pgrst, 'reload schema';
