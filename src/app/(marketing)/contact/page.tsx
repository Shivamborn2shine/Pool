"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";
import { getStoredUtmParams, trackEvent } from "@/lib/analytics";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [subject, setSubject] = useState("Book an onboarding walkthrough");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const utms = getStoredUtmParams();
    trackEvent("form_submit", { form: "contact" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          businessName,
          subject,
          message,
          utmSource: utms.utm_source,
          utmMedium: utms.utm_medium,
          utmCampaign: utms.utm_campaign,
          utmTerm: utms.utm_term,
          utmContent: utms.utm_content,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not send message.");
      } else {
        trackEvent("form_submit_success", { form: "contact" });
        setSubmittedId(json.submissionId);
        setFullName("");
        setEmail("");
        setPhone("");
        setBusinessName("");
        setMessage("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Merchant Support & Onboarding
            </span>
            <h1 className="mt-1 text-3xl font-extrabold text-foreground">
              Talk to the Loopa team
            </h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Need help migrating customer balances from paper cards or setting
              up multi-branch rules? Reach out directly.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded bg-surface border border-border flex items-start gap-3">
              <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Email Support</div>
                <a
                  href={`mailto:${SITE_CONFIG.supportEmail}`}
                  className="text-muted underline hover:text-foreground"
                >
                  {SITE_CONFIG.supportEmail}
                </a>
                <div className="text-muted mt-0.5">
                  SLA: {SITE_CONFIG.responseTimeExpectation}
                </div>
              </div>
            </div>

            <div className="p-4 rounded bg-surface border border-border flex items-start gap-3">
              <Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">
                  Phone & WhatsApp Desk
                </div>
                <div className="text-muted">{SITE_CONFIG.phone}</div>
                <div className="text-muted">WhatsApp: {SITE_CONFIG.whatsapp}</div>
              </div>
            </div>

            <div className="p-4 rounded bg-surface border border-border flex items-start gap-3">
              <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Bengaluru Office</div>
                <div className="text-muted">{SITE_CONFIG.address}</div>
              </div>
            </div>

            <div className="p-4 rounded bg-surface border border-border flex items-start gap-3">
              <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Support Hours</div>
                <div className="text-muted">{SITE_CONFIG.hours}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 border border-border bg-surface rounded p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">
            Send us a message
          </h2>
          <p className="text-xs text-muted mt-1">
            We store your inquiry securely in our support desk and reply via
            email or phone.
          </p>

          {submittedId && (
            <div
              role="status"
              className="mt-4 p-4 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Message received!</strong> Ticket ID:{" "}
                <span className="font-mono">{submittedId}</span>. Our team will
                respond within 4 business hours.
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ct-name"
                  className="block font-semibold uppercase text-foreground"
                >
                  Your Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="ct-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Vikram Rao"
                  className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
                />
              </div>

              <div>
                <label
                  htmlFor="ct-email"
                  className="block font-semibold uppercase text-foreground"
                >
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="ct-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@example.com"
                  className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ct-phone"
                  className="block font-semibold uppercase text-foreground"
                >
                  Phone / WhatsApp
                </label>
                <input
                  id="ct-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
                />
              </div>

              <div>
                <label
                  htmlFor="ct-biz"
                  className="block font-semibold uppercase text-foreground"
                >
                  Business Name
                </label>
                <input
                  id="ct-biz"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Araku Filter Coffee"
                  className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ct-subject"
                className="block font-semibold uppercase text-foreground"
              >
                Topic <span className="text-red-600">*</span>
              </label>
              <input
                id="ct-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="ct-msg"
                className="block font-semibold uppercase text-foreground"
              >
                Message <span className="text-red-600">*</span>
              </label>
              <textarea
                id="ct-msg"
                rows={4}
                required
                minLength={10}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your store locations, monthly customer volume, or question..."
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Sending..." : "Send Message"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

