import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { TOTP } from "otpauth";
import QRCode from "qrcode";
import { cookies } from "next/headers";
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/server-auth";
import {
  checkRateLimit,
  resetRateLimit,
  getRemainingAttempts,
  getRateLimitResetTime,
} from "@/lib/rate-limiter";
import {
  generateCSRFToken,
  validateCSRFToken,
  createCSRFTokenCookie,
} from "@/lib/csrf";
import {
  logLoginSuccess,
  logLoginFailure,
  logSessionRenewed,
  logRateLimitExceeded,
  logCSRFValidationFailed,
} from "@/lib/auth-logger";
import crypto from "crypto";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// In-memory storage for temp secrets (replaces cookie-based approach)
const tempSecrets = new Map<string, { secret: string; expiresAt: number }>();
const TEMP_SECRET_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET - Check if user is registered and get QR code if not
 */
export async function GET() {
  try {
    const user = await prisma.user.findFirst();

    if (!user) {
      // No user exists - generate new TOTP secret for registration
      const totp = new TOTP({
        issuer: "Portfolio Admin",
        label: "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });

      const secret = totp.secret.base32;
      const otpauthUrl = totp.toString();

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Generate unique temp ID and store secret in memory
      const tempId = crypto.randomBytes(16).toString("hex");
      tempSecrets.set(tempId, {
        secret,
        expiresAt: Date.now() + TEMP_SECRET_DURATION,
      });

      // Generate CSRF token
      const { token: csrfToken, cookieHeader } = createCSRFTokenCookie();

      const response = NextResponse.json({
        isRegistered: false,
        qrCodeUrl,
        tempId, // Send tempId instead of secret
        secret, // Send secret for manual entry
        csrfToken,
      });

      // Set CSRF token cookie
      response.headers.set("Set-Cookie", cookieHeader);

      return response;
    }

    // User exists - generate CSRF token for login form
    const { token: csrfToken, cookieHeader } = createCSRFTokenCookie();

    const response = NextResponse.json({
      isRegistered: true,
      csrfToken,
    });

    response.headers.set("Set-Cookie", cookieHeader);

    return response;
  } catch (error) {
    console.error("Registration check error:", error);
    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}

/**
 * POST - Verify OTP and login (handles both registration and regular login)
 */
export async function POST(request: Request) {
  try {
    const { code, tempId, csrfToken } = await request.json();

    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";

    const userAgent = request.headers.get("user-agent") || undefined;

    // Validate CSRF token
    const cookieStore = await cookies();
    const storedCSRFToken = cookieStore.get("csrf_token")?.value;

    if (!csrfToken || !storedCSRFToken || !validateCSRFToken(csrfToken, storedCSRFToken)) {
      logCSRFValidationFailed(ip, userAgent);
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    // Validate OTP code format
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      logLoginFailure(ip, "Invalid OTP format", userAgent);
      return NextResponse.json(
        { success: false, error: "Invalid OTP code" },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(ip);

    if (!rateLimitResult) {
      logRateLimitExceeded(ip);
      const resetTime = getRateLimitResetTime(ip);
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed attempts. Please try again later.",
          resetTime,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst();

    if (!user) {
      // First time registration - verify against temp secret
      if (!tempId) {
        return NextResponse.json(
          { success: false, error: "Registration session expired. Please refresh." },
          { status: 400 }
        );
      }

      const tempRecord = tempSecrets.get(tempId);

      if (!tempRecord || Date.now() > tempRecord.expiresAt) {
        tempSecrets.delete(tempId);
        return NextResponse.json(
          { success: false, error: "Registration session expired. Please refresh." },
          { status: 400 }
        );
      }

      // Verify OTP against temp secret
      const totp = new TOTP({
        issuer: "Portfolio Admin",
        label: "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: tempRecord.secret,
      });

      const delta = totp.validate({ token: code, window: 1 });

      if (delta === null) {
        logLoginFailure(ip, "Invalid OTP during registration", userAgent);
        const remaining = getRemainingAttempts(ip);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid OTP code",
            remainingAttempts: remaining,
          },
          { status: 401 }
        );
      }

      // OTP is valid - create user with this secret
      const newUser = await prisma.user.create({
        data: {
          secret: tempRecord.secret,
          isRegistered: true,
        },
      });

      // Clean up temp secret
      tempSecrets.delete(tempId);

      // Create session
      const session = await createSession(newUser.id);

      const response = NextResponse.json({
        success: true,
        message: "Registration complete! You are now logged in.",
      });

      // Set session cookie
      response.headers.set("Set-Cookie", await setSessionCookie(session));

      // Log successful login
      logLoginSuccess(newUser.id, ip, userAgent);

      // Reset rate limit
      resetRateLimit(ip);

      return response;
    }

    // User exists - verify OTP against stored secret
    const totp = new TOTP({
      issuer: "Portfolio Admin",
      label: "Admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: user.secret,
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      logLoginFailure(ip, "Invalid OTP during login", userAgent);
      const remaining = getRemainingAttempts(ip);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OTP code",
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // OTP is valid - create session
    const session = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    // Set session cookie
    response.headers.set("Set-Cookie", await setSessionCookie(session));

    // Log successful login
    logLoginSuccess(user.id, ip, userAgent);

    // Reset rate limit
    resetRateLimit(ip);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Logout user
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear session cookie
  response.headers.set("Set-Cookie", clearSessionCookie());

  return response;
}
