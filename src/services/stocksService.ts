import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchStockSymbols(): Promise<string[]> {

  // Step 1: Get the last inserted fetched_at from positions table
  const { data: latestFetchData, error: fetchError } = await supabase
    .schema('hf')
    .from('positions')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch latest fetched_at: ${fetchError.message}`);
  }

  if (!latestFetchData) {
    return [];
  }

  const lastFetchedAt = latestFetchData.fetched_at;

  // Step 2: Fetch stock symbols from positions table at that fetched_at
  const { data: stockSymbols, error } = await supabase
    .schema('hf')
    .from('positions')
    .select('symbol')
    .eq('asset_class', 'STK')
    .eq('fetched_at', lastFetchedAt);

  if (error) {
    throw new Error(`Failed to fetch stock symbols: ${error.message}`);
  }

  const uniqueSymbols = [...new Set(stockSymbols.map(order => order.symbol))];
  return uniqueSymbols;
}