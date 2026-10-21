import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/api-auth";

/**
 * File Upload API Endpoint
 * 
 * Accepts multipart/form-data with an image file and saves it to public/uploads/
 * 
 * Supported file types: jpg, jpeg, png, gif, webp
 * Maximum file size: 5MB
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Ensure uploads directory exists
async function ensureUploadsDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Validate file type
function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// Get file extension from mime type
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return mimeToExt[mimeType] || "jpg";
}

// Generate unique filename
function generateUniqueFilename(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only jpg, jpeg, png, gif, webp allowed.",
        },
        { status: 400 }
      );
    }

    // Get file prefix from form data (default to "image")
    const rawPrefix = String(formData.get("prefix") || "image");
    const prefix = rawPrefix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "image";
    const extension = getFileExtension(file.type);
    const filename = generateUniqueFilename(prefix, extension);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the relative path from public directory
    const relativePath = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      filename: filename,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
