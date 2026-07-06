// Input sanitization shared by the validation layer.
//
// XSS defense in this app is layered: React escapes text on render and the
// widget writes user text with textContent, so we deliberately do NOT strip
// HTML characters from stored text (that would corrupt legitimate content
// like "5 < 6"). What this module does:
//   - normalize and strip control/invisible characters that have no business
//     in stored text (null bytes, C0/C1 controls, zero-width and bidi
//     override characters used in spoofing),
//   - enforce that user-supplied URLs are http(s) only, so a value rendered
//     into an href/src (e.g. a product "Shop" link in the widget) can never
//     carry a javascript:, data: or vbscript: scheme.

// Keep \t (9), \n (10), \r (13); strip every other C0/C1 control.
function isStrippable(code: number): boolean {
  if (code === 9 || code === 10 || code === 13) return false;
  if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return true; // C0/DEL/C1
  if (code >= 0x200b && code <= 0x200f) return true; // zero-width + LRM/RLM
  if (code >= 0x202a && code <= 0x202e) return true; // bidi embeddings/overrides
  if (code >= 0x2066 && code <= 0x2069) return true; // bidi isolates
  if (code === 0xfeff) return true; // BOM / zero-width no-break space
  return false;
}

/** Trim, Unicode-normalize, and strip control/invisible characters. */
export function sanitizeText(input: string): string {
  let out = '';
  for (const ch of input.normalize('NFC')) {
    if (!isStrippable(ch.codePointAt(0)!)) out += ch;
  }
  return out.trim();
}

const SAFE_URL_SCHEME = /^https?:$/i;

/**
 * True only for absolute http(s) URLs or app-relative asset paths ("/uploads/…").
 * Everything else — javascript:, data:, vbscript:, file:, mailto:, protocol-
 * relative //evil, and malformed input — is rejected.
 */
export function isSafeUrl(value: string): boolean {
  const v = value.trim();
  if (v.startsWith('/') && !v.startsWith('//')) return true; // app-relative asset
  try {
    return SAFE_URL_SCHEME.test(new URL(v).protocol);
  } catch {
    return false;
  }
}
