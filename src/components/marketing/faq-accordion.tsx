"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function FaqAccordion({
  items = SITE_CONFIG.faqs,
}: {
  items?: typeof SITE_CONFIG.faqs;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border border border-border bg-surface rounded">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-btn-${idx}`;

        return (
          <div key={item.question} className="p-4 sm:p-5">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-foreground hover:text-accent transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 text-muted transition-transform",
                    isOpen && "rotate-180 text-accent"
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "accordion-content mt-2.5 text-sm text-muted leading-relaxed",
                !isOpen && "hidden"
              )}
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

