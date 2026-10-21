import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes

export interface Session {
  userId: string;
  token: string;
  expiresAt: number;
  signature: string;
}

function generateToken(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Signs a session with HMAC-SHA256 using Web Crypto API
 * @param session Session object without signature
 * @returns Hex signature string
 */
async function signSession(session: Omit<Session, "signature">): Promise<string> {
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 16) throw new Error("SESSION_SECRET 未設定");
  const data = `${session.userId}:${session.token}:${session.expiresAt}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBytes = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    dataBytes
  );

  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a new session with 5-minute timeout
 * @param userId User ID to associate with the session
 * @returns Session object
 */
export async function createSession(userId: string): Promise<Session> {
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_DURATION;

  const sessionWithoutSignature = {
    userId,
    token,
    expiresAt,
  };

  const signature = await signSession(sessionWithoutSignature);

  const session: Session = {
    ...sessionWithoutSignature,
    signature,
  };

  return session;
}

/**
 * Retrieves the current session from cookies
 * @returns Session object if valid and not expired, otherwise null
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: Session = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return null;
    }

    // SECURITY FIX: Verify session signature
    const expectedSignature = await signSession({
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
    });

    if (session.signature !== expectedSignature) {
      console.warn("[SECURITY] Session signature verification failed");
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Checks if the current session is valid and authenticated
 * @returns true if session exists and is not expired
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Clears the current session from cookies
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Renews the session with a new 5-minute expiration
 * @returns Renewed session or null if no active session
 */
export async function renewSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const renewedSession = createSession(session.userId);
  return renewedSession;
}

/**
 * Gets the remaining session time in minutes
 * @returns Remaining minutes or 0 if no active session
 */
export async function getSessionTimeRemaining(): Promise<number> {
  const session = await getSession();
  if (!session) {
    return 0;
  }

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
}

/**
 * Sets the session cookie
 * @param session Session object to store
 * @returns Cookie string to set
 */
export async function setSessionCookie(session: Session): Promise<string> {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(session)
  )}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; SameSite=lax; Path=/; Max-Age=${SESSION_DURATION / 1000}`;
}

/**
 * Clears the session cookie
 * @returns Cookie string to clear
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure=${
    process.env.NODE_ENV === "production"
  }; SameSite=lax; Path=/; Max-Age=0`;
}
