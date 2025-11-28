export interface Position {
  id: number;
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
  delta?: number;
  price?: number;
  unrealized_pnl?: number;
  avgPrice?: number;
  undConid?: string;
  computed_cash_flow_on_entry?: number;
  computed_cash_flow_on_exercise?: number;
  computed_be_price?: number;
}

export interface PutPosition extends Position {
  option_type: 'PUT';
}