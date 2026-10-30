import React from "react";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    redirect("/login");
  }

  return (
    <AdminShell
      businessName={ctx.business.name}
      businessSlug={ctx.business.slug}
      userName={ctx.user.full_name}
      userEmail={ctx.user.email}
      role={ctx.role}
      isPlatformAdmin={ctx.user.is_platform_admin}
      isImpersonating={ctx.isImpersonating}
      impersonationReason={ctx.impersonationReason}
    >
      {children}
    </AdminShell>
  );
}

