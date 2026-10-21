import crypto from "crypto";
import { TOTP } from "otpauth";
import QRCode from "qrcode";

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newRecoveryCodes() {
  return Array.from({ length: 8 }, () => {
    const bytes = crypto.randomBytes(8);
    return Array.from(bytes, (byte) => RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]).join("");
  });
}

export function hashRecoveryCode(code: string) {
  const normalized = code.replace(/[\s-]/g, "").toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function portalTotp(username: string, secret?: string) {
  return new TOTP({
    issuer: "智慧醫療作品集",
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    ...(secret ? { secret } : {}),
  });
}

export async function portalTotpSetup(username: string, secret?: string) {
  const totp = portalTotp(username, secret);
  return {
    secret: totp.secret.base32,
    qrCodeUrl: await QRCode.toDataURL(totp.toString()),
  };
}

export function portalTotpValid(username: string, secret: string, code: string) {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  return portalTotp(username, secret).validate({ token, window: 1 }) !== null;
}
