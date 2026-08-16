import { supabaseServer } from '../../../lib/supabaseServer';
import PinGate from '../../components/PinGate';
import LabelHargaStyle from '../../components/LabelHargaStyle';
import LabelClient from './LabelClient';

export const dynamic = 'force-dynamic';

// Label harga untuk showcase chiller. Dipisah dari halaman Admin karena
// dicetak, bukan dipakai sehari-hari — dan halaman cetak harus bersih dari
// tombol dan menu navigasi.
export default async function LabelHargaPage() {
  const db = supabaseServer();
  const [c, m] = await Promise.all([
    db.from('categories').select('id, name, sort_order').order('sort_order'),
    db.from('menu_items')
      .select('id, name, price, description, category_id, needs_cook_method, discount_percent, sort_order')
      .eq('available', true)
      .order('sort_order'),
  ]);

  return (
    <PinGate scope="admin" title="Masuk Admin">
      <LabelHargaStyle />
      <LabelClient
        categories={c.data || []}
        items={m.data || []}
        merchant={process.env.NEXT_PUBLIC_MERCHANT_NAME || 'BBQIU'}
      />
    </PinGate>
  );
}
