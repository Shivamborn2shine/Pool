import QRCode from "qrcode";

export function getPublicCardUrl(
  publicId: string,
  baseUrl?: string
): string {
  const root = (
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://loopacards.netlify.app"
  ).replace(/\/$/, "");
  // CARD-09: QR never contains balances, secrets, or internal UUIDs — only publicId
  return `${root}/card/${encodeURIComponent(publicId)}`;
}

export async function generateCardQrSvg(
  publicId: string,
  primaryColor: string = "#18181B",
  baseUrl?: string
): Promise<string> {
  const url = getPublicCardUrl(publicId, baseUrl);
  return QRCode.toString(url, {
    type: "svg",
    margin: 2,
    width: 320,
    errorCorrectionLevel: "M",
    color: {
      dark: primaryColor || "#18181B",
      light: "#FFFFFF",
    },
  });
}

export async function generateCardQrPngBuffer(
  publicId: string,
  primaryColor: string = "#18181B",
  baseUrl?: string
): Promise<Buffer> {
  const url = getPublicCardUrl(publicId, baseUrl);
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 2,
    width: 600,
    errorCorrectionLevel: "M",
    color: {
      dark: primaryColor || "#18181B",
      light: "#FFFFFF",
    },
  });
}

export async function generateCardQrDataUrl(
  publicId: string,
  primaryColor: string = "#18181B",
  baseUrl?: string
): Promise<string> {
  const url = getPublicCardUrl(publicId, baseUrl);
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 320,
    errorCorrectionLevel: "M",
    color: {
      dark: primaryColor || "#18181B",
      light: "#FFFFFF",
    },
  });
}

/**
 * QR-01..08: Generic Store QR code URL — never contains customer data, balances, or internal IDs
 */
export function getStoreQrUrl(
  storeSlug: string,
  baseUrl?: string
): string {
  const root = (
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://loopacards.netlify.app"
  ).replace(/\/$/, "");
  return `${root}/s/${encodeURIComponent(storeSlug)}`;
}

export async function generateStoreQrSvg(
  storeSlug: string,
  primaryColor: string = "#18181B",
  baseUrl?: string
): Promise<string> {
  const url = getStoreQrUrl(storeSlug, baseUrl);
  return QRCode.toString(url, {
    type: "svg",
    margin: 2,
    width: 360,
    errorCorrectionLevel: "M",
    color: {
      dark: primaryColor || "#18181B",
      light: "#FFFFFF",
    },
  });
}

export async function generateStoreQrPngBuffer(
  storeSlug: string,
  primaryColor: string = "#18181B",
  baseUrl?: string
): Promise<Buffer> {
  const url = getStoreQrUrl(storeSlug, baseUrl);
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 2,
    width: 640,
    errorCorrectionLevel: "M",
    color: {
      dark: primaryColor || "#18181B",
      light: "#FFFFFF",
    },
  });
}

export async function generateStoreQrDataUrl(
  storeSlug: string,
  primaryColor: string = "#18181B",
  baseUrl?: string
): Promise<string> {
  const url = getStoreQrUrl(storeSlug, baseUrl);
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 360,
    errorCorrectionLevel: "M",
    color: {
      dark: primaryColor || "#18181B",
      light: "#FFFFFF",
    },
  });
}


