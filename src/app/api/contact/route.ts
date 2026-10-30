import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { contactSubmissionSchema } from "@/lib/validation";
import { checkRateLimit, getClientContext } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(`contact:${ipAddress}`, 8, 900);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = contactSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid contact fields." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const [submission] = await sql`
      INSERT INTO public.contact_submissions (
        full_name,
        email,
        phone,
        business_name,
        subject,
        message,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content
      ) VALUES (
        ${d.fullName.trim()},
        ${d.email.toLowerCase().trim()},
        ${d.phone || null},
        ${d.businessName || null},
        ${d.subject.trim()},
        ${d.message.trim()},
        ${d.utmSource || null},
        ${d.utmMedium || null},
        ${d.utmCampaign || null},
        ${d.utmTerm || null},
        ${d.utmContent || null}
      )
      RETURNING id, created_at
    `;

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json(
      { error: "Could not send message right now." },
      { status: 500 }
    );
  }
}

