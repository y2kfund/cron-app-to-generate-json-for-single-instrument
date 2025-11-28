export interface PositionData {
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

export interface InstrumentData {
  symbol: string;
  totalCapitalUsed: number;
  lastUpdated: string;
  putPositions: PositionData[];
  metadata: {
    totalPutContracts: number;
    accountsWithPositions: string[];
  };
}

export interface Order {
  symbol: string;
  internal_account_id: string;
  assetCategory: string;
  market_value: number;
  market_price: number;
}

export interface PutPosition {
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