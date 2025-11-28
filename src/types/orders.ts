export interface Order {
  symbol: string;
  internal_account_id: string;
  contract_quantity: number;
  market_value: number;
  market_price: number;
  asset_category: string;
  conid: string;
  fetched_at: string;
}

export interface OrderDetails {
  symbol: string;
  totalCapitalUsed: number;
  putPositions: PutPosition[];
}

export interface PutPosition {
  internal_account_id: string;
  contract_quantity: number;
  market_value: number;
  market_price: number;
  fetched_at: string;
}