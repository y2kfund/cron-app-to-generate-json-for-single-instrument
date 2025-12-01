import { writeJsonToFile } from '../utils/fileHandler';
import { fetchCurrentPositions, fetchPutPositions, fetchCallPositions } from './positionsService';
import { calculateTotalCapitalUsed } from './capitalCalculator';
import { SupabaseClient } from '@supabase/supabase-js';

interface PositionData {
  symbol: string;
  internal_account_id: string;
  contract_quantity: number;
  accounting_quantity: number;
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
  currentPositions: PositionData[];
  putPositions: PositionData[];
  callPositions: PositionData[];
  metadata: {
    totalCurrentContracts: number;
    totalPutContracts: number;
    totalCallContracts: number;
    accountsWithPositions: string[];
  };
}

export async function generateJsonForSymbol(supabase: SupabaseClient, symbol: string): Promise<void> {
  // Calculate total capital used using the new service
  const capitalData = await calculateTotalCapitalUsed(supabase, symbol);

  // Fetch CURRENT positions
  const currentPositions = await fetchCurrentPositions(symbol);

  // Fetch PUT positions
  const putPositions = await fetchPutPositions(symbol);

  // Fetch CALL positions (if needed in future)
  const callPositions = await fetchCallPositions(symbol);

  const instrumentData: InstrumentData = {
    symbol,
    totalCapitalUsed: capitalData.totalCapitalUsed,
    totalQuantity: capitalData.totalQuantity,
    currentMarketPrice: capitalData.currentMarketPrice,
    lastUpdated: new Date().toISOString(),
    currentPositions,
    putPositions,
    callPositions,
    metadata: {
      totalCurrentContracts: currentPositions.reduce(
        (sum: number, pos: any) => sum + Math.abs(parseFloat(pos.accounting_quantity) || 0),
        0
      ),
      totalPutContracts: putPositions.reduce(
        (sum: number, pos: any) => sum + Math.abs(parseFloat(pos.accounting_quantity) || 0),
        0
      ),
      totalCallContracts: callPositions.reduce(
        (sum: number, pos: any) => sum + Math.abs(parseFloat(pos.accounting_quantity) || 0),
        0
      ),
      accountsWithPositions: [...new Set(putPositions.map(pos => pos.legal_entity).filter((entity): entity is string => entity !== undefined))],
    },
  };

  const fileName = `${symbol}.json`;
  await writeJsonToFile(fileName, instrumentData);
}