import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { fetchStockSymbols } from './services/stocksService';
import { fetchPutPositions } from './services/positionsService';
import { generateJsonForSymbol } from './services/jsonGenerator';
import { logInfo, logError } from './utils/logger';

async function main() {
  try {
    logInfo('Fetching stock symbols from stocks table...');
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

    console.error('Supabase URL:', supabaseUrl ? 'Loaded' : 'Not Loaded');
    console.error('Supabase Service Key:', supabaseServiceKey ? 'Loaded' : 'Not Loaded');

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const symbols = await fetchStockSymbols();

    for (const symbol of symbols) {
      logInfo(`Processing symbol: ${symbol}`);
      const putPositions = await fetchPutPositions(symbol);
      const totalCapitalUsed = putPositions.reduce((total, pos) => total + (pos.market_value || 0), 0);

      await generateJsonForSymbol(supabase, symbol);
      logInfo(`JSON file generated/updated for symbol: ${symbol}`);
    }

    logInfo('All symbols processed successfully.');
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
  }
}

main();