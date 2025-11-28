import { SupabaseClient } from '@supabase/supabase-js';

interface StockPosition {
  symbol: string;
  contract_quantity: number;
  market_price: number;
  market_value: number;
  asset_class: string;
}

interface CapitalData {
  totalCapitalUsed: number;
  totalQuantity: number;
  currentMarketPrice: number;
}

export async function calculateTotalCapitalUsed(
  supabase: SupabaseClient,
  symbol: string
): Promise<CapitalData> {
  // console.log(`💰 Calculating total capital used for ${symbol}`);

  try {
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
      // console.log(`⚠️ No positions found in the table`);
      return { totalCapitalUsed: 0, totalQuantity: 0, currentMarketPrice: 0 };
    }

    const lastFetchedAt = latestFetchData.fetched_at;
    // console.log(`📅 Last fetched_at: ${lastFetchedAt}`);

    // Step 2: Get sum of accounting_quantity for STK positions at that fetched_at
    const { data: stkPositions, error: stkError } = await supabase
      .schema('hf')
      .from('positions')
      .select('accounting_quantity')
      .eq('symbol', symbol)
      .eq('asset_class', 'STK')
      .eq('fetched_at', lastFetchedAt);

    if (stkError) {
      throw new Error(`Failed to fetch STK positions for ${symbol}: ${stkError.message}`);
    }

    if (!stkPositions || stkPositions.length === 0) {
      // console.log(`⚠️ No STK positions found for ${symbol} at ${lastFetchedAt}`);
      return { totalCapitalUsed: 0, totalQuantity: 0, currentMarketPrice: 0 };
    }

    // Calculate total shares from accounting_quantity
    const totalShares = stkPositions.reduce(
      (sum: number, pos: any) => sum + Math.abs(parseFloat(pos.accounting_quantity) || 0),
      0
    );

    // console.log(`📊 Total shares for ${symbol}: ${totalShares}`);

    // Step 3: Get market price from market_price table
    const { data: marketPriceData, error: priceError } = await supabase
      .schema('hf')
      .from('market_price')
      .select('market_price')
      .eq('symbol', symbol)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (priceError) {
      throw new Error(`Failed to fetch market price for ${symbol}: ${priceError.message}`);
    }

    if (!marketPriceData) {
      // console.log(`⚠️ No market price found for ${symbol}`);
      return { totalCapitalUsed: 0, totalQuantity: totalShares, currentMarketPrice: 0 };
    }

    const pricePerShare = parseFloat(marketPriceData.market_price) || 0;
    // console.log(`💵 Price per share for ${symbol}: ${pricePerShare}`);

    if (totalShares === 0 || pricePerShare === 0) {
      // console.log(`⚠️ Cannot calculate capital: totalShares=${totalShares}, pricePerShare=${pricePerShare}`);
      return { totalCapitalUsed: 0, totalQuantity: totalShares, currentMarketPrice: pricePerShare };
    }

    // Step 4: Calculate total capital
    const totalCapital = totalShares * pricePerShare;

    return {
      totalCapitalUsed: totalCapital,
      totalQuantity: totalShares,
      currentMarketPrice: pricePerShare
    };

  } catch (error) {
    console.error(`❌ Error calculating capital for ${symbol}:`, error);
    throw error;
  }
}