import crypto from 'crypto';

// Unambiguous alphabet (no 0/O, 1/I/L) for codes customers read out loud.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomBlock(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// e.g. genCode('AVR') -> "AVR-K3F9-P2MW"
export function genCode(prefix = 'AVR'): string {
  return `${prefix.toUpperCase()}-${randomBlock(4)}-${randomBlock(4)}`;
}

// e.g. gift cards: "GJ3K-9FQ2-MW7T-XZ4P"
export function genGiftCardCode(): string {
  return [randomBlock(4), randomBlock(4), randomBlock(4), randomBlock(4)].join('-');
}

// Short referral handle, e.g. "MAYA-4XKP"
export function genReferralCode(name?: string | null): string {
  const base = (name ?? '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `${base || 'FRIEND'}-${randomBlock(4)}`;
}
