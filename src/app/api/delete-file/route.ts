import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/api-auth";
import { isInsideDir } from "@/lib/security";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Delete File API Endpoint
 * 
 * Deletes a file from the public/uploads directory
 * Only allows deletion of files in the uploads directory for security
 */

export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Only allow deletion of files in the uploads directory
    if (!filePath.startsWith("/uploads/")) {
      return NextResponse.json(
        { success: false, error: "Can only delete uploaded files" },
        { status: 400 }
      );
    }

    // SECURITY FIX: Prevent path traversal attacks
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes("..") || !normalizedPath.startsWith("/uploads/")) {
      return NextResponse.json(
        { success: false, error: "Invalid file path - path traversal detected" },
        { status: 400 }
      );
    }

    // Construct full file path
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const fullPath = path.resolve(uploadsDir, path.basename(normalizedPath));
    if (!isInsideDir(uploadsDir, fullPath)) {
      return NextResponse.json(
        { success: false, error: "Access denied - invalid path" },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({
        success: true,
        message: "File does not exist",
      });
    }

    // Delete the file
    await unlink(fullPath);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
