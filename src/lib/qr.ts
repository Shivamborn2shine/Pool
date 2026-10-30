import QRCode from "qrcode";

export function getPublicCardUrl(
  publicId: string,
  baseUrl?: string
): string {
  const root = (
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
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

