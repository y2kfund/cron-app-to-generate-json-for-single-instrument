import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types/orders';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchStockSymbols(): Promise<string[]> {
  const { data: orderSymbols, error } = await supabase
    .schema('hf')
    .from('orders')
    .select('symbol')
    .eq('assetCategory', 'STK');

  if (error) {
    throw new Error(`Failed to fetch stock symbols: ${error.message}`);
  }

  const uniqueSymbols = [...new Set(orderSymbols.map(order => order.symbol))];
  return uniqueSymbols;
}