import { sql } from "@/lib/db";
import { getClientContext } from "@/lib/auth";

export interface AuditLogInput {
  businessId?: string | null;
  actorUserId?: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = getClientContext();
    await sql`
      INSERT INTO public.audit_logs (
        business_id,
        actor_user_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        before_state,
        after_state,
        ip_address,
        user_agent
      ) VALUES (
        ${input.businessId ?? null},
        ${input.actorUserId ?? null},
        ${input.actorRole},
        ${input.action},
        ${input.entityType},
        ${input.entityId ?? null},
        ${input.beforeState ? sql.json(input.beforeState as never) : null},
        ${input.afterState ? sql.json(input.afterState as never) : null},
        ${ipAddress},
        ${userAgent}
      )
    `;
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

