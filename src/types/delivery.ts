export interface DeliveryFilterParams {
  limit?: number;
  offset?: number;
  priority?: string;
  weight_max?: number;
  distance_max?: number;
  pickup_date_from?: string;
  pickup_date_to?: string;
  fragile?: boolean;
  requires_signature?: boolean;
  radius?: number;
  search?: string;
  sort_by?: 'priority' | 'distance' | 'pickup_date' | 'delivery_fee';
  sort_order?: 'asc' | 'desc';
}
