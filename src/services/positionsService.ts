import { createClient } from '@supabase/supabase-js';
import { Position } from '../types/positions';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchPutPositions(symbol: string): Promise<Position[]> {
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

  // Step 2: Fetch PUT positions for the symbol at that fetched_at
  const { data, error } = await supabase
    .schema('hf')
    .from('positions')
    .select('*')
    .ilike('symbol', `${symbol}% P %`)
    .eq('fetched_at', lastFetchedAt);

  if (error) {
    throw new Error(`Failed to fetch PUT positions for ${symbol}: ${error.message}`);
  }

  return data as Position[];
}

export async function fetchCallPositions(symbol: string): Promise<Position[]> {
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

  // Step 2: Fetch CALL positions for the symbol at that fetched_at
  const { data, error } = await supabase
    .schema('hf')
    .from('positions')
    .select('*')
    .ilike('symbol', `${symbol}% C %`)
    .eq('fetched_at', lastFetchedAt);

  if (error) {
    throw new Error(`Failed to fetch CALL positions for ${symbol}: ${error.message}`);
  }

  return data as Position[];
}