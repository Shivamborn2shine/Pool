import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const acceptSchema = z.object({
  token: z.string().min(8, "Invalid invitation token"),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { token, fullName, password, phone } = parsed.data;
    const invites = await sql`
      SELECT * FROM public.business_users
      WHERE invite_token = ${token}
        AND status = 'invited'
      LIMIT 1
    `;

    if (invites.length === 0) {
      return NextResponse.json(
        { error: "Invitation link is invalid or has already been used." },
        { status: 404 }
      );
    }

    const invite = invites[0];
    if (
      invite.invite_expires_at &&
      new Date(invite.invite_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "This staff invitation has expired. Ask the owner to resend." },
        { status: 410 }
      );
    }

    const email = (invite.invited_email || "").toLowerCase().trim();
    const passwordHash = hashPassword(password);

    const user = await sql.begin(async (tx) => {
      const existingUsers = await tx`
        SELECT * FROM public.users WHERE email = ${email} LIMIT 1
      `;

      let targetUser;
      if (existingUsers.length > 0) {
        targetUser = existingUsers[0];
      } else {
        const [created] = await tx`
          INSERT INTO public.users (email, password_hash, full_name, phone, email_verified_at, last_login_at)
          VALUES (${email}, ${passwordHash}, ${fullName.trim()}, ${phone || null}, NOW(), NOW())
          RETURNING *
        `;
        targetUser = created;
      }

      await tx`
        UPDATE public.business_users
        SET user_id = ${targetUser.id},
            status = 'active',
            invite_token = NULL,
            joined_at = NOW(),
            updated_at = NOW()
        WHERE id = ${invite.id}
      `;

      return targetUser;
    });

    await createSession(user.id, invite.business_id);

    await writeAuditLog({
      businessId: invite.business_id,
      actorUserId: user.id,
      actorRole: invite.role,
      action: "staff.invite_accepted",
      entityType: "business_user",
      entityId: invite.id,
      afterState: { email, role: invite.role },
    });

    return NextResponse.json({
      success: true,
      businessId: invite.business_id,
      role: invite.role,
    });
  } catch (err) {
    console.error("POST /api/auth/accept-invite error:", err);
    return NextResponse.json(
      { error: "Failed to accept staff invitation." },
      { status: 500 }
    );
  }
}

