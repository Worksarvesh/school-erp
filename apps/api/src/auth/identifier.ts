import { parsePhoneNumberFromString } from 'libphonenumber-js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalises a login identifier the way users.phone / users.email are stored:
 * email -> trimmed lower case; phone -> E.164, Indian numbers assumed without a country code.
 * Returns null when it is neither a valid email nor a valid phone number.
 */
export function normalizeIdentifier(raw: string): string | null {
  const value = raw.trim();
  if (value.includes('@')) {
    const email = value.toLowerCase();
    return EMAIL.test(email) ? email : null;
  }
  return normalizePhone(value);
}

/** Phone only (OTP login): E.164, Indian numbers assumed without a country code; else null. */
export function normalizePhone(raw: string): string | null {
  const value = raw.trim();
  if (value.includes('@')) {
    return null;
  }
  const phone = parsePhoneNumberFromString(value, 'IN');
  return phone?.isValid() ? phone.number : null;
}
