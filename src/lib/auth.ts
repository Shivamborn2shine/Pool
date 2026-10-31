import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { sql, getSupabaseAdmin } from "@/lib/db";
import type { Business, LoyaltyRules, User, UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "loopa_session";
const SESSION_TTL_DAYS = 14;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, keyHex] = parts;
    const derived = crypto.scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(keyHex, "hex");
    if (derived.length !== keyBuf.length) return false;
    return crypto.timingSafeEqual(derived, keyBuf);
  } catch {
    return false;
  }
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getClientContext(): { ipAddress: string; userAgent: string } {
  try {
    const h = headers();
    const forwarded = h.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : h.get("x-real-ip") || "127.0.0.1";
    const userAgent = h.get("user-agent") || "unknown";
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: "127.0.0.1", userAgent: "server" };
  }
}

export async function checkRateLimit(
  key: string,
  maxHits: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const resetAt = new Date(Date.now() + windowSeconds * 1000).toISOString();
    const rows = await sql`
      INSERT INTO public.rate_limits (key, hits, reset_at)
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT (key) DO UPDATE
      SET
        hits = CASE
          WHEN public.rate_limits.reset_at < NOW() THEN 1
          ELSE public.rate_limits.hits + 1
        END,
        reset_at = CASE
          WHEN public.rate_limits.reset_at < NOW() THEN ${resetAt}::timestamptz
          ELSE public.rate_limits.reset_at
        END
      RETURNING hits
    `;
    const hits = Number(rows[0]?.hits ?? 1);
    return {
      allowed: hits <= maxHits,
      remaining: Math.max(0, maxHits - hits),
    };
  } catch {
    return { allowed: true, remaining: maxHits };
  }
}

export async function createSession(
  userId: string,
  activeBusinessId?: string | null
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  const { ipAddress, userAgent } = getClientContext();

  await sql`
    INSERT INTO public.user_sessions (
      token_hash, user_id, active_business_id, ip_address, user_agent, expires_at
    ) VALUES (
      ${tokenHash}, ${userId}, ${activeBusinessId ?? null}, ${ipAddress}, ${userAgent}, ${expiresAt.toISOString()}
    )
  `;

  cookies().set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return rawToken;
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await sql`DELETE FROM public.user_sessions WHERE token_hash = ${tokenHash}`;
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Ignore cookie errors outside request context
  }
}

export interface AuthenticatedContext {
  sessionId: string;
  user: User;
  business: Business;
  role: UserRole;
  rules: LoyaltyRules;
  isImpersonating: boolean;
  impersonationReason: string | null;
}

export async function getSessionContext(): Promise<AuthenticatedContext | null> {
  const rawToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  try {

    const tokenHash = hashToken(rawToken);
    const sessions = await sql`
      SELECT
        s.id AS session_id,
        s.active_business_id,
        s.impersonated_business_id,
        s.impersonation_reason,
        u.id AS user_id,
        u.email,
        u.full_name,
        u.phone,
        u.status AS user_status,
        u.is_platform_admin,
        u.email_verified_at,
        u.last_login_at,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
      FROM public.user_sessions s
      JOIN public.users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.status = 'active'
      LIMIT 1
    `;

    if (sessions.length === 0) return null;
    const s = sessions[0];

    const user: User = {
      id: s.user_id,
      email: s.email,
      full_name: s.full_name,
      phone: s.phone,
      status: s.user_status,
      is_platform_admin: Boolean(s.is_platform_admin),
      email_verified_at: s.email_verified_at,
      last_login_at: s.last_login_at,
      created_at: s.user_created_at,
      updated_at: s.user_updated_at,
    };

    const targetBusinessId =
      s.impersonated_business_id || s.active_business_id;

    let membershipRows;
    if (s.impersonated_business_id && user.is_platform_admin) {
      membershipRows = await sql`
        SELECT b.*, 'owner'::text AS member_role
        FROM public.businesses b
        WHERE b.id = ${s.impersonated_business_id}
        LIMIT 1
      `;
    } else if (targetBusinessId) {
      membershipRows = await sql`
        SELECT b.*, bu.role AS member_role
        FROM public.business_users bu
        JOIN public.businesses b ON b.id = bu.business_id
        WHERE bu.user_id = ${user.id}
          AND bu.business_id = ${targetBusinessId}
          AND bu.status = 'active'
        LIMIT 1
      `;
    }

    if (!membershipRows || membershipRows.length === 0) {
      membershipRows = await sql`
        SELECT b.*, bu.role AS member_role
        FROM public.business_users bu
        JOIN public.businesses b ON b.id = bu.business_id
        WHERE bu.user_id = ${user.id}
          AND bu.status = 'active'
        ORDER BY bu.created_at ASC
        LIMIT 1
      `;
    }

    if (!membershipRows || membershipRows.length === 0) {
      return null;
    }

    const bRow = membershipRows[0];
    const business: Business = {
      id: bRow.id,
      name: bRow.name,
      slug: bRow.slug,
      logo_url: bRow.logo_url,
      primary_color: bRow.primary_color,
      currency: bRow.currency,
      timezone: bRow.timezone,
      address: bRow.address,
      phone: bRow.phone,
      email: bRow.email,
      status: bRow.status,
      subscription_plan: bRow.subscription_plan,
      order_prefix: bRow.order_prefix || undefined,
      order_sequence: bRow.order_sequence !== null ? Number(bRow.order_sequence) : undefined,
      tax_percentage: bRow.tax_percentage !== null ? Number(bRow.tax_percentage) : 5,
      order_expiry_minutes: bRow.order_expiry_minutes !== null ? Number(bRow.order_expiry_minutes) : 20,
      require_table_number: Boolean(bRow.require_table_number ?? false),
      created_at: bRow.created_at,
      updated_at: bRow.updated_at,
    };

    let rulesRows = await sql`
      SELECT * FROM public.loyalty_rules
      WHERE business_id = ${business.id}
      LIMIT 1
    `;

    if (rulesRows.length === 0) {
      rulesRows = await sql`
        INSERT INTO public.loyalty_rules (business_id)
        VALUES (${business.id})
        ON CONFLICT (business_id) DO UPDATE SET updated_at = NOW()
        RETURNING *
      `;
    }

    const rRow = rulesRows[0];
    const rules: LoyaltyRules = {
      id: rRow.id,
      business_id: rRow.business_id,
      points_per_currency_unit: Number(rRow.points_per_currency_unit),
      currency_unit: Number(rRow.currency_unit),
      minimum_purchase_amount: Number(rRow.minimum_purchase_amount),
      maximum_points_per_transaction: Number(
        rRow.maximum_points_per_transaction
      ),
      points_value_per_100: Number(rRow.points_value_per_100),
      minimum_redemption_points: Number(rRow.minimum_redemption_points),
      claim_enabled: Boolean(rRow.claim_enabled),
      claim_window_days: Number(rRow.claim_window_days),
      daily_claim_limit: Number(rRow.daily_claim_limit),
      receipt_required_above_amount: Number(rRow.receipt_required_above_amount),
      signup_bonus_points: Number(rRow.signup_bonus_points),
      points_expiry_months:
        rRow.points_expiry_months !== null
          ? Number(rRow.points_expiry_months)
          : null,
      campaign_name: rRow.campaign_name,
      campaign_multiplier: Number(rRow.campaign_multiplier ?? 1),
      campaign_ends_at: rRow.campaign_ends_at,
      manager_adjustment_limit: Number(rRow.manager_adjustment_limit ?? 500),
      allow_negative_balance: Boolean(rRow.allow_negative_balance),
      status: rRow.status,
      created_at: rRow.created_at,
      updated_at: rRow.updated_at,
    };

    return {
      sessionId: s.session_id,
      user,
      business,
      role: bRow.member_role as UserRole,
      rules,
      isImpersonating: Boolean(s.impersonated_business_id),
      impersonationReason: s.impersonation_reason || null,
    };
  } catch (err) {
    console.error("getSessionContext error:", err);
    return null;
  }
}

export function hasRolePermission(
  role: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(role);
}

/**
 * Triggers Supabase Auth transactional email if configured, while also returning
 * the direct action link so admins/devs can copy or inspect it immediately.
 */
export async function triggerSupabaseTransactionalEmail(
  type: "invite" | "recovery",
  email: string,
  redirectUrl: string
): Promise<{ sentViaSupabase: boolean }> {
  try {
    const supabase = getSupabaseAdmin();
    if (type === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { sentViaSupabase: !error };
    } else {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
      });
      return { sentViaSupabase: !error };
    }
  } catch {
    return { sentViaSupabase: false };
  }
}

