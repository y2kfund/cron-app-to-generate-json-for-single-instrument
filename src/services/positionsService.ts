import { createClient } from '@supabase/supabase-js';
import { Position } from '../types/positions';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchPutPositions(symbol: string): Promise<Position[]> {
  const { data, error } = await supabase
    .schema('hf')
    .from('positions')
    .select('*')
    .ilike('symbol', `${symbol}%`)
    .ilike('symbol', `% P %`);

  if (error) {
    throw new Error(`Failed to fetch PUT positions for ${symbol}: ${error.message}`);
  }

  return data as Position[];
}