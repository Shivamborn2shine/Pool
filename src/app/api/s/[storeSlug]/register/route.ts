import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkRateLimit, getClientContext } from "@/lib/auth";
import { storeCustomerRegisterSchema } from "@/lib/validation";
import {
  generateCardNumber,
  generatePublicId,
  maskPhone,
  normalizePhone,
} from "@/lib/utils";
import { resolveCustomerDisplayName, computeExpiryDate } from "@/lib/loyalty";

export async function POST(
  request: Request,
  { params }: { params: { storeSlug: string } }
) {
  try {
    const { ipAddress } = getClientContext();
    const rl = await checkRateLimit(
      `store_reg:${params.storeSlug}:${ipAddress}`,
      15,
      60
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait a minute and retry." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = storeCustomerRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid phone number." },
        { status: 400 }
      );
    }

    const { phone, fullName, email, loyaltyConsent, marketingConsent } =
      parsed.data;
    const normalizedPhone = normalizePhone(phone);
    const digitsOnly = normalizedPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Resolve business
    const qrMatches = await sql`
      SELECT b.*
      FROM public.store_qr_codes q
      JOIN public.businesses b ON b.id = q.business_id
      WHERE q.slug = ${params.storeSlug} AND q.status = 'active'
      LIMIT 1
    `;
    const businesses =
      qrMatches.length > 0
        ? qrMatches
        : await sql`
            SELECT * FROM public.businesses
            WHERE slug = ${params.storeSlug}
            LIMIT 1
          `;

    if (businesses.length === 0) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }
    const business = businesses[0];

    const [rules] = await sql`
      SELECT * FROM public.loyalty_rules
      WHERE business_id = ${business.id}
      LIMIT 1
    `;

    const result = await sql.begin(async (tx) => {
      const existingCustomers = await tx`
        SELECT * FROM public.customers
        WHERE business_id = ${business.id} AND phone = ${normalizedPhone}
        LIMIT 1
      `;

      let customer = existingCustomers[0];
      let isReturningCustomer = Boolean(customer);

      if (customer) {
        // Update optional name/email if customer provided them and profile had a Guest placeholder
        const updatedName =
          fullName && fullName.trim().length >= 2
            ? fullName.trim()
            : customer.full_name;
        const updatedEmail =
          email && email.trim().length > 3
            ? email.trim().toLowerCase()
            : customer.email;

        if (
          updatedName !== customer.full_name ||
          updatedEmail !== customer.email
        ) {
          const [up] = await tx`
            UPDATE public.customers
            SET
              full_name = ${updatedName},
              email = ${updatedEmail},
              marketing_consent = ${Boolean(marketingConsent) || Boolean(customer.marketing_consent)},
              updated_at = NOW()
            WHERE id = ${customer.id}
            RETURNING *
          `;
          customer = up;
        }
      } else {
        const displayFallback = resolveCustomerDisplayName(
          fullName,
          null,
          digitsOnly.slice(-3)
        );
        const [createdCust] = await tx`
          INSERT INTO public.customers (
            business_id,
            full_name,
            phone,
            email,
            loyalty_consent,
            marketing_consent,
            status
          ) VALUES (
            ${business.id},
            ${fullName && fullName.trim().length >= 2 ? fullName.trim() : displayFallback},
            ${normalizedPhone},
            ${email && email.trim() ? email.trim().toLowerCase() : null},
            ${loyaltyConsent},
            ${Boolean(marketingConsent)},
            'active'
          )
          RETURNING *
        `;
        customer = createdCust;
        isReturningCustomer = false;
      }

      // Ensure customer has an active loyalty card
      const existingCards = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE customer_id = ${customer.id} AND business_id = ${business.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      let card = existingCards[0];
      if (!card) {
        const signupBonus =
          rules && rules.status === "active"
            ? Number(rules.signup_bonus_points ?? 0)
            : 0;
        const cardNumber = generateCardNumber(business.slug);
        const publicId = generatePublicId();

        const [newCard] = await tx`
          INSERT INTO public.loyalty_cards (
            business_id,
            customer_id,
            card_number,
            public_id,
            status,
            points_balance,
            redeemable_amount,
            lifetime_points_earned
          ) VALUES (
            ${business.id},
            ${customer.id},
            ${cardNumber},
            ${publicId},
            'active',
            ${signupBonus},
            0,
            ${signupBonus}
          )
          RETURNING *
        `;
        card = newCard;

        if (signupBonus > 0) {
          const expiresAt = rules
            ? computeExpiryDate({
                points_expiry_months:
                  rules.points_expiry_months !== null
                    ? Number(rules.points_expiry_months)
                    : null,
              })
            : null;
          await tx`
            INSERT INTO public.transactions (
              business_id,
              card_id,
              type,
              points_change,
              amount_change,
              points_balance_after,
              redeemable_amount_after,
              description,
              expires_at
            ) VALUES (
              ${business.id},
              ${card.id},
              'points_earned',
              ${signupBonus},
              0,
              ${signupBonus},
              0,
              'Welcome bonus points on Store QR registration',
              ${expiresAt}
            )
          `;
        }
      }

      const recentOrders = await tx`
        SELECT
          id,
          public_token,
          order_number,
          customer_display_name,
          order_type,
          table_number,
          status,
          total,
          points_earned,
          payment_status,
          created_at
        FROM public.orders
        WHERE customer_id = ${customer.id} AND business_id = ${business.id}
        ORDER BY created_at DESC
        LIMIT 5
      `;

      return {
        isReturningCustomer,
        customer: {
          id: customer.id,
          displayName: resolveCustomerDisplayName(
            fullName,
            customer.full_name,
            digitsOnly.slice(-3)
          ),
          fullName: customer.full_name,
          maskedPhone: maskPhone(customer.phone),
          phoneLast4: digitsOnly.slice(-4),
        },
        card: {
          id: card.id,
          public_id: card.public_id,
          card_number: card.card_number,
          status: card.status,
          points_balance: Number(card.points_balance),
          redeemable_amount: Number(card.redeemable_amount),
          pending_points: Number(card.pending_points),
        },
        recentOrders,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/s/[storeSlug]/register error:", err);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}

