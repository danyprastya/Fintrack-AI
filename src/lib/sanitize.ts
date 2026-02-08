/**
 * Input sanitization utilities
 *
 * Protects against XSS, injection attacks, and malformed input.
 * Since we use Firestore (NoSQL), SQL injection is not applicable,
 * but we still sanitize to prevent stored XSS and data corruption.
 */

/** Strip HTML tags and script content */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Validate and normalize email */
export function sanitizeEmail(email: string): string | null {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(sanitized) ? sanitized : null;
}

/** Validate Indonesian phone number, return normalized format */
export function sanitizePhone(phone: string): string | null {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Handle various Indonesian formats
  if (digits.startsWith("62")) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("+62")) {
    digits = "0" + digits.slice(3);
  } else if (!digits.startsWith("0")) {
    digits = "0" + digits;
  }

  // Indonesian mobile numbers: 08xx (10-13 digits)
  const phoneRegex = /^08\d{8,11}$/;
  if (!phoneRegex.test(digits)) return null;

  return digits;
}

/** Convert local phone to international format */
export function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  return "62" + digits;
}

/** Password strength validation rules */
export interface PasswordCheck {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPasswordStrength(password: string): PasswordCheck {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const checks = checkPasswordStrength(password);
  return Object.values(checks).every(Boolean);
}

/** Generate a random numeric OTP code */
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/** Generate a random alphanumeric code for Telegram linking */
export function generateLinkCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
