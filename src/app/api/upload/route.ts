import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/db";
import { checkRateLimit, getClientContext } from "@/lib/auth";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "pdf",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(`upload:${ipAddress}`, 20, 600);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many file uploads. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucketType = (formData.get("bucket") as string) || "receipts";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const isAllowed =
      ALLOWED_TYPES.has(file.type) || ALLOWED_EXTENSIONS.has(ext);

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Upload PNG, JPG, WebP, SVG, or PDF only.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size of 5 MB." },
        { status: 400 }
      );
    }

    let contentType = file.type;
    if (
      !contentType ||
      contentType === "application/octet-stream" ||
      !ALLOWED_TYPES.has(contentType)
    ) {
      if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
      else if (ext === "png") contentType = "image/png";
      else if (ext === "webp") contentType = "image/webp";
      else if (ext === "svg") contentType = "image/svg+xml";
      else if (ext === "pdf") contentType = "application/pdf";
      else contentType = "image/jpeg";
    }

    const fileName = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.${ext}`;
    const targetBucket =
      bucketType === "business-assets" ? "business-assets" : "receipts";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        {
          error: `Storage upload error: ${uploadError.message || "Failed to upload file to storage."}`,
        },
        { status: 500 }
      );
    }

    if (targetBucket === "business-assets") {
      const { data } = supabase.storage
        .from("business-assets")
        .getPublicUrl(fileName);
      return NextResponse.json({
        success: true,
        url: data.publicUrl,
        path: fileName,
      });
    }

    // Private receipts bucket: generate time-limited signed URL (Security Section 11)
    const { data: signedData, error: signError } = await supabase.storage
      .from("receipts")
      .createSignedUrl(fileName, 7 * 24 * 60 * 60); // 7-day signed URL for admin review

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to sign receipt URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: signedData.signedUrl,
      path: fileName,
    });
  } catch (err: any) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed." },
      { status: 500 }
    );
  }
}

