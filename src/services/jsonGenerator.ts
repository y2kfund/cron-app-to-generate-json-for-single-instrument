import { writeJsonToFile } from '../utils/fileHandler';
import { fetchPutPositions } from './positionsService';
import { SupabaseClient } from '@supabase/supabase-js';

interface PositionData {
  symbol: string;
  internal_account_id: string;
  contract_quantity: number;
  market_value: number;
  market_price: number;
  asset_class: string;
  conid: string;
  fetched_at: string;
  legal_entity?: string;
}

interface InstrumentData {
  symbol: string;
  totalCapitalUsed: number;
  lastUpdated: string;
  putPositions: PositionData[];
  metadata: {
    totalPutContracts: number;
    accountsWithPositions: string[];
  };
}

export async function generateJsonForSymbol(supabase: SupabaseClient, symbol: string): Promise<void> {
  const { data: stkPositions, error: stkError } = await supabase
    .schema('hf')
    .from('positions')
    .select('*')
    .eq('symbol', symbol)
    .eq('asset_class', 'STK');

  if (stkError) {
    throw new Error(`Failed to fetch STK positions for ${symbol}: ${stkError.message}`);
  }

  const totalCapitalUsed = (stkPositions || []).reduce(
    (sum: number, pos: any) => sum + (parseFloat(pos.market_value) || 0),
    0
  );

  const putPositions = await fetchPutPositions(symbol);

  const instrumentData: InstrumentData = {
    symbol,
    totalCapitalUsed,
    lastUpdated: new Date().toISOString(),
    putPositions,
    metadata: {
      totalPutContracts: putPositions.reduce(
        (sum: number, pos: any) => sum + Math.abs(parseFloat(pos.contract_quantity) || 0),
        0
      ),
      accountsWithPositions: [...new Set(putPositions.map(pos => pos.legal_entity).filter((entity): entity is string => entity !== undefined))],
    },
  };

  const fileName = `${symbol}.json`;
  await writeJsonToFile(fileName, instrumentData);
}