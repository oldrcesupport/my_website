export interface PublicRestaurantSettings {
  restaurant_name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  currency_unit: string;
  currency_label: string;
  ticket_price_toman: number;
  is_demo_price: boolean;
  sales_enabled: boolean;
  business_timezone: string;
  business_day_cutoff: string;
  current_business_date: string;
  sales_cutoff_active: boolean;
  checkout_remaining_seconds: number;
  capacity_enabled: boolean;
  capacity_policy: string;
}

export interface OrderPayload {
  purchaser_name: string;
  purchaser_phone: string;
  purchaser_email?: string;
  quantity: number;
}

export interface OrderResponse {
  order_public_id: string;
  quantity: number;
  unit_price_toman: number;
  total_price_toman: number;
  currency_unit: string;
  business_date: string;
  payment_deadline: string;
  payment_redirect_url: string;
  guest_access_token: string;
}

export interface TicketPass {
  id: number;
  public_id: string;
  ticket_number: string;
  status: string;
  effective_status: "VALID" | "USED" | "EXPIRED" | "CANCELLED" | "NOT_YET_VALID";
  business_date: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
  used_at?: string | null;
  qr_payload: string;
  qr_data_uri: string;
  raw_token?: string;
}

export interface OrderTicketsResponse {
  order_public_id: string;
  purchaser_name: string;
  business_date: string;
  order_status: string;
  reference_id?: string;
  guest_access_token?: string;
  tickets: TicketPass[];
}

export interface OrderStatusResponse {
  public_id: string;
  purchaser_name: string;
  purchaser_phone: string;
  quantity: number;
  unit_price_toman: number;
  total_price_toman: number;
  currency_unit: string;
  business_date: string;
  status: string;
  created_at: string;
  paid_at?: string | null;
  payment_deadline: string;
  tickets_count: number;
  reference_id?: string | null;
  ticket_numbers?: string[];
}

export interface StaffUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF_SCANNER";
  is_super_admin: boolean;
  is_admin: boolean;
  can_scan: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface DashboardStats {
  current_business_date: string;
  today_paid_tickets_count: number;
  today_revenue_toman: number;
  today_checkins_count: number;
  today_unused_valid_tickets: number;
  pending_payments_count: number;
  late_review_orders_count: number;
  recent_orders: Array<{
    public_id: string;
    purchaser_name: string;
    purchaser_phone: string;
    quantity: number;
    total_price_toman: number;
    status: string;
    created_at: string;
  }>;
  recent_checkins: Array<{
    id: number;
    ticket_number: string;
    staff_username: string;
    result: string;
    scanned_at: string;
    scanner_device_id: string;
    notes: string;
  }>;
}

export interface CheckInScanResult {
  result: "SUCCESS" | "ALREADY_USED" | "EXPIRED" | "CANCELLED" | "ORDER_UNPAID" | "INVALID_TOKEN";
  message: string;
  ticket_number?: string;
  scanned_at?: string;
  used_at?: string | null;
}

