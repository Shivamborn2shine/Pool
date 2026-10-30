import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import {
  checkRateLimit,
  createSession,
  getClientContext,
  verifyPassword,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(`login:${ipAddress}`, 15, 600);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid credentials." },
        { status: 400 }
      );
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();
    const users = await sql`
      SELECT * FROM public.users WHERE email = ${cleanEmail} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = users[0];
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "This account has been suspended. Contact support." },
        { status: 403 }
      );
    }

    const valid = verifyPassword(parsed.data.password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const memberships = await sql`
      SELECT business_id, role
      FROM public.business_users
      WHERE user_id = ${user.id} AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 1
    `;

    const activeBusinessId = memberships[0]?.business_id ?? null;

    await sql`
      UPDATE public.users SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${user.id}
    `;

    await createSession(user.id, activeBusinessId);

    await writeAuditLog({
      businessId: activeBusinessId,
      actorUserId: user.id,
      actorRole: memberships[0]?.role || "owner",
      action: "user.login",
      entityType: "user",
      entityId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isPlatformAdmin: Boolean(user.is_platform_admin),
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}

