import { writeJsonToFile } from '../utils/fileHandler';
import { fetchPutPositions } from './positionsService';
import { calculateTotalCapitalUsed } from './capitalCalculator';
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
  totalQuantity: number;
  currentMarketPrice: number;
  lastUpdated: string;
  putPositions: PositionData[];
  metadata: {
    totalPutContracts: number;
    accountsWithPositions: string[];
  };
}

export async function generateJsonForSymbol(supabase: SupabaseClient, symbol: string): Promise<void> {
  // Calculate total capital used using the new service
  const capitalData = await calculateTotalCapitalUsed(supabase, symbol);

  // Fetch PUT positions
  const putPositions = await fetchPutPositions(symbol);

  const instrumentData: InstrumentData = {
    symbol,
    totalCapitalUsed: capitalData.totalCapitalUsed,
    totalQuantity: capitalData.totalQuantity,
    currentMarketPrice: capitalData.currentMarketPrice,
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