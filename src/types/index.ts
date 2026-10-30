export type UserRole = "owner" | "manager" | "cashier";
export type CardStatus = "active" | "frozen" | "closed";
export type PurchaseSource = "admin_entered" | "customer_claim";
export type PurchaseStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "duplicate"
  | "expired";

export type TransactionType =
  | "purchase"
  | "points_earned"
  | "points_redeemed"
  | "credit_earned"
  | "credit_redeemed"
  | "adjustment"
  | "expiry"
  | "reversal"
  | "order_points_earned"
  | "order_points_reversed"
  | "reward_points_used"
  | "reward_points_restored";

export type OrderStatus =
  | "created"
  | "awaiting_confirmation"
  | "confirmed"
  | "awaiting_payment"
  | "paid"
  | "points_credited"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled"
  | "rejected"
  | "expired"
  | "refunded";

export type OrderType = "dine_in" | "takeaway" | "pickup";
export type PaymentMethod = "cash" | "online" | "pending";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type RedemptionStatus =
  | "requested"
  | "approved"
  | "fulfilled"
  | "cancelled"
  | "rejected";

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  currency: string;
  timezone: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive" | "suspended";
  subscription_plan: "starter" | "growth" | "scale";
  order_prefix?: string;
  order_sequence?: number;
  tax_percentage?: number;
  order_expiry_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessLocation {
  id: string;
  business_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  status: "active" | "suspended";
  is_platform_admin: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: UserRole;
  status: "active" | "invited" | "revoked" | "disabled";
  location_id: string | null;
  invited_by_user_id: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  notes: string | null;
  tags: string[];
  marketing_consent: boolean;
  loyalty_consent: boolean;
  status: "active" | "archived" | "deletion_requested";
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyCard {
  id: string;
  business_id: string;
  customer_id: string;
  card_number: string;
  public_id: string;
  status: CardStatus;
  points_balance: number;
  redeemable_amount: number;
  pending_points: number;
  lifetime_points_earned: number;
  lifetime_points_redeemed: number;
  lifetime_purchase_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  business_id: string;
  location_id: string | null;
  customer_id: string;
  card_id: string;
  amount: number;
  currency: string;
  purchase_date: string;
  receipt_number: string | null;
  receipt_file_url: string | null;
  category: string | null;
  notes: string | null;
  points_awarded: number;
  source: PurchaseSource;
  status: PurchaseStatus;
  claimed_by_customer_id: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  card_id: string;
  purchase_id: string | null;
  reward_redemption_id: string | null;
  type: TransactionType;
  points_change: number;
  amount_change: number;
  points_balance_after: number;
  redeemable_amount_after: number;
  description: string;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_required: number;
  monetary_value: number;
  stock_limit: number | null;
  redeemed_count: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  business_id: string;
  card_id: string;
  reward_id: string | null;
  redemption_type: "reward" | "store_credit";
  points_used: number;
  monetary_value: number;
  status: RedemptionStatus;
  requested_by_customer_id: string | null;
  processed_by_user_id: string | null;
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyRules {
  id: string;
  business_id: string;
  points_per_currency_unit: number;
  currency_unit: number;
  minimum_purchase_amount: number;
  maximum_points_per_transaction: number;
  points_value_per_100: number;
  minimum_redemption_points: number;
  claim_enabled: boolean;
  claim_window_days: number;
  daily_claim_limit: number;
  receipt_required_above_amount: number;
  signup_bonus_points: number;
  points_expiry_months: number | null;
  campaign_name: string | null;
  campaign_multiplier: number;
  campaign_ends_at: string | null;
  manager_adjustment_limit: number;
  allow_negative_balance: boolean;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface AdjustmentRequest {
  id: string;
  business_id: string;
  card_id: string;
  requested_by_user_id: string;
  wallet_type: "points" | "credit";
  points_Delta: number;
  amount_delta: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by_user_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string | null;
  actor_user_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface StoreQrCode {
  id: string;
  business_id: string;
  location_id: string | null;
  type: "store" | "branch" | "table" | "campaign" | "receipt";
  slug: string;
  destination_url: string;
  status: "active" | "inactive";
  label: string;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  business_id: string;
  menu_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_available: boolean;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  business_id: string;
  menu_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  is_visible: boolean;
  sort_order: number;
  loyalty_multiplier: number;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  loyalty_multiplier: number;
  variant_details: { name: string; price_delta: number }[];
  addon_details: { name: string; price: number }[];
  notes: string | null;
  created_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  event: string;
  actor_type: "customer" | "staff" | "system";
  actor_id: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  id: string;
  public_token: string;
  idempotency_key: string | null;
  business_id: string;
  customer_id: string;
  card_id: string;
  order_number: string;
  customer_display_name: string;
  order_type: OrderType;
  table_number: string | null;
  status: OrderStatus;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  reward_points_used: number;
  reward_value_used: number;
  points_earned: number;
  total: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  notes: string | null;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  paid_at: string | null;
  points_credited_at: string | null;
  prepared_at: string | null;
  ready_at: string | null;
  served_at: string | null;
  cancelled_at: string | null;
  cancelled_by_user_id: string | null;
  cancellation_reason: string | null;
  expires_at: string | null;
  items?: OrderItem[];
  events?: OrderEvent[];
  created_at: string;
  updated_at: string;
}


