import { sql } from "../src/lib/db";

async function run() {
  console.log("Adding schema columns for growth & verification features...");

  await sql.unsafe(`
    -- 1. customer_bonus_claims columns
    ALTER TABLE public.customer_bonus_claims ADD COLUMN IF NOT EXISTS proof_handle TEXT;
    ALTER TABLE public.customer_bonus_claims ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'verified';

    -- 2. customers birthday & activity tracking
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthday_day INTEGER;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthday_month INTEGER;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ DEFAULT NOW();

    -- 3. orders referral tracking
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referred_by_card_id UUID REFERENCES public.loyalty_cards(id) ON DELETE SET NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_reward_credited BOOLEAN DEFAULT FALSE;

    -- 4. performance indexes
    CREATE INDEX IF NOT EXISTS idx_customer_bonus_claims_proof ON public.customer_bonus_claims(card_id, task_id);
    CREATE INDEX IF NOT EXISTS idx_customers_last_visited ON public.customers(business_id, last_visited_at);
    CREATE INDEX IF NOT EXISTS idx_orders_referred_by ON public.orders(referred_by_card_id);
  `);

  console.log("Database schema successfully upgraded!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

