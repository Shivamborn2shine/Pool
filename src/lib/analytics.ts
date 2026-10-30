export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_STORAGE_KEY = "loopa_utm_params";
const COOKIE_CONSENT_KEY = "loopa_cookie_consent";

export function captureUtmParamsFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const keys: (keyof UtmParams)[] = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    const captured: UtmParams = {};
    let found = false;

    for (const key of keys) {
      const val = params.get(key);
      if (val) {
        captured[key] = val;
        found = true;
      }
    }

    if (found) {
      const existing = getStoredUtmParams();
      const merged = { ...existing, ...captured };
      window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return getStoredUtmParams();
  } catch {
    return {};
  }
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

export function trackEvent(
  eventName: string,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === "rejected") return;

    const utms = getStoredUtmParams();
    // Never log passwords, OTPs, tokens, or sensitive PII
    const safePayload: Record<string, unknown> = { ...utms, ...payload };
    delete safePayload.password;
    delete safePayload.token;
    delete safePayload.otp;

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[Loopa Analytics] ${eventName}`, safePayload);
    }
  } catch {
    // No-op if storage blocked
  }
}

