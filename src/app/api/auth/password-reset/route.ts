import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import {
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientContext,
  getSessionContext,
  hashPassword,
  hashToken,
  triggerSupabaseTransactionalEmail,
  verifyPassword,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

// Request Password Reset Link (AUTH-03)
export async function POST(request: Request) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(`pwd-reset:${ipAddress}`, 8, 900);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many reset requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = passwordResetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Valid email required." },
        { status: 400 }
      );
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();
    const users = await sql`
      SELECT id, email FROM public.users WHERE email = ${cleanEmail} LIMIT 1
    `;

    let fallbackResetUrl: string | null = null;

    if (users.length > 0) {
      const rawToken = crypto.randomBytes(24).toString("base64url");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await sql`
        UPDATE public.users
        SET reset_token_hash = ${tokenHash},
            reset_token_expires_at = ${expiresAt.toISOString()},
            updated_at = NOW()
        WHERE id = ${users[0].id}
      `;

      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      ).replace(/\/$/, "");
      fallbackResetUrl = `${appUrl}/forgot-password?token=${encodeURIComponent(
        rawToken
      )}`;

      await triggerSupabaseTransactionalEmail(
        "recovery",
        cleanEmail,
        fallbackResetUrl
      );

      console.info(
        `[Loopa Password Reset] Link for ${cleanEmail}: ${fallbackResetUrl}`
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, a password reset link has been generated.",
      resetPreviewUrl: fallbackResetUrl,
    });
  } catch (err) {
    console.error("POST /api/auth/password-reset error:", err);
    return NextResponse.json(
      { error: "Failed to process password reset request." },
      { status: 500 }
    );
  }
}

// Confirm Password Reset via Token OR Change Password when Logged In (AUTH-03 / AUTH-04)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Case 1: Reset with token
    if (body.token) {
      const parsed = passwordResetConfirmSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid input." },
          { status: 400 }
        );
      }

      const tokenHash = hashToken(parsed.data.token);
      const users = await sql`
        SELECT id, email FROM public.users
        WHERE reset_token_hash = ${tokenHash}
          AND reset_token_expires_at > NOW()
        LIMIT 1
      `;

      if (users.length === 0) {
        return NextResponse.json(
          { error: "Reset link is invalid or has expired." },
          { status: 400 }
        );
      }

      const newHash = hashPassword(parsed.data.newPassword);
      await sql`
        UPDATE public.users
        SET password_hash = ${newHash},
            reset_token_hash = NULL,
            reset_token_expires_at = NULL,
            updated_at = NOW()
        WHERE id = ${users[0].id}
      `;

      await writeAuditLog({
        actorUserId: users[0].id,
        actorRole: "user",
        action: "user.password_reset_completed",
        entityType: "user",
        entityId: users[0].id,
      });

      return NextResponse.json({
        success: true,
        message: "Your password has been updated. You can now sign in.",
      });
    }

    // Case 2: Authenticated user changing password (AUTH-04)
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid password input." },
        { status: 400 }
      );
    }

    const [userRow] = await sql`
      SELECT password_hash FROM public.users WHERE id = ${ctx.user.id} LIMIT 1
    `;
    if (
      !userRow ||
      !verifyPassword(parsed.data.currentPassword, userRow.password_hash)
    ) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const newHash = hashPassword(parsed.data.newPassword);
    await sql`
      UPDATE public.users
      SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${ctx.user.id}
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "user.password_changed",
      entityType: "user",
      entityId: ctx.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("PATCH /api/auth/password-reset error:", err);
    return NextResponse.json(
      { error: "Could not update password." },
      { status: 500 }
    );
  }
}

