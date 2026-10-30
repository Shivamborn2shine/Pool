import React from "react";
import {
  PublicHeader,
  PublicFooter,
} from "@/components/marketing/public-shell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}

