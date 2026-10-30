import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env manually for standalone script execution
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres.axkhqktmixesmrafcrju:Shivam%40161189@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function migrate() {
  console.log("Connecting to Supabase PostgreSQL...");
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

    console.log("Creating Loopa tables and constraints...");

    await sql.unsafe(`
      -- 1. businesses
      CREATE TABLE IF NOT EXISTS public.businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        primary_color TEXT NOT NULL DEFAULT '#18181B',
        currency TEXT NOT NULL DEFAULT 'INR',
        timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
        address TEXT,
        phone TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        subscription_plan TEXT NOT NULL DEFAULT 'growth' CHECK (subscription_plan IN ('starter', 'growth', 'scale')),
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 2. business_locations (P1 Multi-location support BIZ-07)
      CREATE TABLE IF NOT EXISTS public.business_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 3. users
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
        is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
        reset_token_hash TEXT,
        reset_token_expires_at TIMESTAMPTZ,
        email_verified_at TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 4. user_sessions (HTTP-only session backing store + impersonation support)
      CREATE TABLE IF NOT EXISTS public.user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        active_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
        impersonated_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
        impersonation_reason TEXT,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 5. business_users (RBAC & Staff Invitations AUTH-05..07)
      CREATE TABLE IF NOT EXISTS public.business_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        invited_email TEXT,
        role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cashier')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'revoked', 'disabled')),
        location_id UUID REFERENCES public.business_locations(id) ON DELETE SET NULL,
        invited_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        invite_token TEXT UNIQUE,
        invite_expires_at TIMESTAMPTZ,
        joined_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 6. customers
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        date_of_birth DATE,
        notes TEXT,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
        loyalty_consent BOOLEAN NOT NULL DEFAULT TRUE,
        otp_code_hash TEXT,
        otp_expires_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deletion_requested')),
        created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_customers_business_phone UNIQUE (business_id, phone)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_business_email
        ON public.customers (business_id, LOWER(email))
        WHERE email IS NOT NULL AND email <> '';

      -- 7. loyalty_cards
      CREATE TABLE IF NOT EXISTS public.loyalty_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        card_number TEXT NOT NULL UNIQUE,
        public_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
        points_balance INTEGER NOT NULL DEFAULT 0,
        redeemable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        pending_points INTEGER NOT NULL DEFAULT 0,
        lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
        lifetime_points_redeemed INTEGER NOT NULL DEFAULT 0,
        lifetime_purchase_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 8. purchases
      CREATE TABLE IF NOT EXISTS public.purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        location_id UUID REFERENCES public.business_locations(id) ON DELETE SET NULL,
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
        currency TEXT NOT NULL DEFAULT 'INR',
        purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        receipt_number TEXT,
        receipt_file_url TEXT,
        category TEXT,
        notes TEXT,
        points_awarded INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL CHECK (source IN ('admin_entered', 'customer_claim')),
        status TEXT NOT NULL CHECK (status IN ('approved', 'pending', 'rejected', 'duplicate', 'expired')),
        claimed_by_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
        reviewed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        review_note TEXT,
        created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 9. rewards
      CREATE TABLE IF NOT EXISTS public.rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        points_required INTEGER NOT NULL CHECK (points_required > 0),
        monetary_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        stock_limit INTEGER,
        redeemed_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 10. reward_redemptions
      CREATE TABLE IF NOT EXISTS public.reward_redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
        reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
        redemption_type TEXT NOT NULL DEFAULT 'reward' CHECK (redemption_type IN ('reward', 'store_credit')),
        points_used INTEGER NOT NULL DEFAULT 0,
        monetary_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'fulfilled', 'cancelled', 'rejected')),
        requested_by_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
        processed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 11. transactions (Immutable Ledger)
      CREATE TABLE IF NOT EXISTS public.transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
        purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
        reward_redemption_id UUID REFERENCES public.reward_redemptions(id) ON DELETE SET NULL,
        type TEXT NOT NULL CHECK (type IN ('purchase', 'points_earned', 'points_redeemed', 'credit_earned', 'credit_redeemed', 'adjustment', 'expiry', 'reversal')),
        points_change INTEGER NOT NULL DEFAULT 0,
        amount_change NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        points_balance_after INTEGER NOT NULL,
        redeemable_amount_after NUMERIC(12, 2) NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        expires_at TIMESTAMPTZ,
        expired_processed BOOLEAN NOT NULL DEFAULT FALSE,
        created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 12. loyalty_rules
      CREATE TABLE IF NOT EXISTS public.loyalty_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
        points_per_currency_unit NUMERIC(10, 2) NOT NULL DEFAULT 1,
        currency_unit NUMERIC(10, 2) NOT NULL DEFAULT 10,
        minimum_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 50,
        maximum_points_per_transaction INTEGER NOT NULL DEFAULT 500,
        points_value_per_100 NUMERIC(10, 2) NOT NULL DEFAULT 100,
        minimum_redemption_points INTEGER NOT NULL DEFAULT 100,
        claim_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        claim_window_days INTEGER NOT NULL DEFAULT 7,
        daily_claim_limit INTEGER NOT NULL DEFAULT 3,
        receipt_required_above_amount NUMERIC(12, 2) NOT NULL DEFAULT 500,
        signup_bonus_points INTEGER NOT NULL DEFAULT 25,
        points_expiry_months INTEGER DEFAULT 12,
        campaign_name TEXT,
        campaign_multiplier NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
        campaign_ends_at TIMESTAMPTZ,
        manager_adjustment_limit INTEGER NOT NULL DEFAULT 500,
        allow_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 13. adjustment_requests (For Manager adjustments exceeding manager_adjustment_limit BAL-09)
      CREATE TABLE IF NOT EXISTS public.adjustment_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
        requested_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        wallet_type TEXT NOT NULL CHECK (wallet_type IN ('points', 'credit')),
        points_delta INTEGER NOT NULL DEFAULT 0,
        amount_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        review_note TEXT,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 14. privacy_requests (DPDP Act 2023 Data Deletion / Export / Correction CUST-11)
      CREATE TABLE IF NOT EXISTS public.privacy_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL CHECK (request_type IN ('deletion', 'export', 'correction')),
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
        processed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        resolution_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );

      -- 15. contact_submissions (Public contact form + UTM tracking)
      CREATE TABLE IF NOT EXISTS public.contact_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        business_name TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_term TEXT,
        utm_content TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 16. rate_limits (Security rate limiting AUTH-09)
      CREATE TABLE IF NOT EXISTS public.rate_limits (
        key TEXT PRIMARY KEY,
        hits INTEGER NOT NULL DEFAULT 1,
        reset_at TIMESTAMPTZ NOT NULL
      );

      -- 17. audit_logs (Immutable security & compliance audit trail)
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
        actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        before_state JSONB,
        after_state JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 18. Extend businesses with QR Ordering settings
      ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS order_prefix TEXT NOT NULL DEFAULT 'SC';
      ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS order_sequence INTEGER NOT NULL DEFAULT 1000;
      ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.00;
      ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS order_expiry_minutes INTEGER NOT NULL DEFAULT 20;

      -- 19. store_qr_codes (Generic dynamic store QR codes QR-01..08)
      CREATE TABLE IF NOT EXISTS public.store_qr_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        location_id UUID REFERENCES public.business_locations(id) ON DELETE SET NULL,
        type TEXT NOT NULL DEFAULT 'store' CHECK (type IN ('store', 'branch', 'table', 'campaign', 'receipt')),
        slug TEXT NOT NULL UNIQUE,
        destination_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        label TEXT NOT NULL DEFAULT 'Main Store Counter QR',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 20. menus
      CREATE TABLE IF NOT EXISTS public.menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 21. menu_categories
      CREATE TABLE IF NOT EXISTS public.menu_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 22. menu_items
      CREATE TABLE IF NOT EXISTS public.menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
        currency TEXT NOT NULL DEFAULT 'INR',
        image_url TEXT,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        loyalty_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 23. menu_item_variants
      CREATE TABLE IF NOT EXISTS public.menu_item_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 24. menu_item_addons
      CREATE TABLE IF NOT EXISTS public.menu_item_addons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 25. orders
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        public_token TEXT NOT NULL UNIQUE,
        idempotency_key TEXT UNIQUE,
        business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
        order_number TEXT NOT NULL,
        customer_display_name TEXT NOT NULL,
        order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'pickup')),
        table_number TEXT,
        status TEXT NOT NULL DEFAULT 'awaiting_confirmation' CHECK (status IN (
          'created',
          'awaiting_confirmation',
          'confirmed',
          'awaiting_payment',
          'paid',
          'points_credited',
          'preparing',
          'ready',
          'served',
          'cancelled',
          'rejected',
          'expired',
          'refunded'
        )),
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        tax_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        reward_points_used INTEGER NOT NULL DEFAULT 0,
        reward_value_used NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        points_earned INTEGER NOT NULL DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        currency TEXT NOT NULL DEFAULT 'INR',
        payment_method TEXT NOT NULL DEFAULT 'pending' CHECK (payment_method IN ('cash', 'online', 'pending')),
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_reference TEXT,
        notes TEXT,
        confirmed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        confirmed_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        points_credited_at TIMESTAMPTZ,
        prepared_at TIMESTAMPTZ,
        ready_at TIMESTAMPTZ,
        served_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        cancelled_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        cancellation_reason TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_orders_business_number UNIQUE (business_id, order_number)
      );

      -- 26. order_items
      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
        item_name TEXT NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        total_price NUMERIC(12, 2) NOT NULL,
        loyalty_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
        variant_details JSONB NOT NULL DEFAULT '[]'::jsonb,
        addon_details JSONB NOT NULL DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 27. order_events
      CREATE TABLE IF NOT EXISTS public.order_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        event TEXT NOT NULL CHECK (event IN (
          'created',
          'confirmed',
          'rejected',
          'payment_pending',
          'paid',
          'points_credited',
          'preparing',
          'ready',
          'served',
          'cancelled',
          'expired',
          'refunded'
        )),
        actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'staff', 'system')),
        actor_id TEXT,
        note TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 28. Extend transactions with order_id and order transaction types
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
      ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
      ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (
        type IN (
          'purchase',
          'points_earned',
          'points_redeemed',
          'credit_earned',
          'credit_redeemed',
          'adjustment',
          'expiry',
          'reversal',
          'order_points_earned',
          'order_points_reversed',
          'reward_points_used',
          'reward_points_restored'
        )
      );
    `);

    console.log("Creating performance indexes (supabase-postgres-best-practices)...");
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_business_locations_business ON public.business_locations(business_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_business_users_business ON public.business_users(business_id);
      CREATE INDEX IF NOT EXISTS idx_business_users_user ON public.business_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
      CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers(business_id, full_name, phone);
      CREATE INDEX IF NOT EXISTS idx_loyalty_cards_business ON public.loyalty_cards(business_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON public.loyalty_cards(customer_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_business_date ON public.purchases(business_id, purchase_date DESC);
      CREATE INDEX IF NOT EXISTS idx_purchases_card ON public.purchases(card_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_claims_queue ON public.purchases(business_id, status, created_at DESC) WHERE source = 'customer_claim';
      CREATE INDEX IF NOT EXISTS idx_transactions_card_created ON public.transactions(card_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_business_created ON public.transactions(business_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_order ON public.transactions(order_id);
      CREATE INDEX IF NOT EXISTS idx_rewards_business_status ON public.rewards(business_id, status);
      CREATE INDEX IF NOT EXISTS idx_redemptions_business_status ON public.reward_redemptions(business_id, status, requested_at DESC);
      CREATE INDEX IF NOT EXISTS idx_redemptions_card ON public.reward_redemptions(card_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_business_created ON public.audit_logs(business_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_store_qr_codes_business ON public.store_qr_codes(business_id, status);
      CREATE INDEX IF NOT EXISTS idx_menus_business ON public.menus(business_id, status);
      CREATE INDEX IF NOT EXISTS idx_menu_categories_menu ON public.menu_categories(menu_id, sort_order ASC);
      CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id, sort_order ASC);
      CREATE INDEX IF NOT EXISTS idx_menu_items_business ON public.menu_items(business_id, is_visible, is_available);
      CREATE INDEX IF NOT EXISTS idx_orders_business_status ON public.orders(business_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_card ON public.orders(card_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_events_order ON public.order_events(order_id, created_at ASC);
    `);

    console.log("Enabling Row-Level Security (RLS) on all public tables...");
    const tables = [
      "businesses",
      "business_locations",
      "users",
      "user_sessions",
      "business_users",
      "customers",
      "loyalty_cards",
      "purchases",
      "rewards",
      "reward_redemptions",
      "transactions",
      "loyalty_rules",
      "adjustment_requests",
      "privacy_requests",
      "contact_submissions",
      "rate_limits",
      "audit_logs",
      "store_qr_codes",
      "menus",
      "menu_categories",
      "menu_items",
      "menu_item_variants",
      "menu_item_addons",
      "orders",
      "order_items",
      "order_events",
    ];

    for (const table of tables) {
      await sql.unsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    console.log("Provisioning Supabase Storage buckets...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseSecret) {
      const supabase = createClient(supabaseUrl, supabaseSecret);
      const { data: buckets } = await supabase.storage.listBuckets();
      const existingNames = new Set((buckets || []).map((b) => b.name));

      if (!existingNames.has("business-assets")) {
        await supabase.storage.createBucket("business-assets", {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
        });
        console.log("Created public bucket: business-assets");
      }

      if (!existingNames.has("receipts")) {
        await supabase.storage.createBucket("receipts", {
          public: false,
          fileSizeLimit: 8 * 1024 * 1024,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/webp",
            "application/pdf",
          ],
        });
        console.log("Created private bucket: receipts");
      }
    }

    console.log("Database migration completed successfully!");
  } finally {
    await sql.end();
  }
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

