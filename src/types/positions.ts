export interface Position {
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

export interface PutPosition extends Position {
  option_type: 'PUT';
}