// Mojibake slug sanitiser.
//
// paul365 produces slugs from team names that have been through a known
// encoding bug (UTF-8 read as Latin-1 then run through WP's remove_accents).
// The fingerprint in stored slugs is `a%c2%XX` where XX is a hex pair in the
// Latin-1 supplement range. The leading `a` is the result of WP transliterating
// the misinterpreted lead byte 0xC3 (`Ã`); the trailing %c2%XX is the original
// non-ASCII character round-tripped back through UTF-8.
//
// We map the corrupted pair to the sensible ASCII transliteration the slug
// would have got if the upstream encoding had been correct: `a%c2%b6` (`ö`)
// becomes `o`, `a%c2%bc` (`ü`) becomes `u`, and so on. Result is a clean
// ASCII-only slug suitable for use as a URL path component.
//
// Reproducing this in JS rather than fixing paul365 is the pragmatic choice
// for now: the Bet365 feed names are out of our control, and the encoding
// bug in WP's pipeline is hard to track down. Cleaning at the Astro layer
// fixes the public URLs without touching the WordPress data.

// Single-character map: the trailing %c2%XX byte (lowercase hex) to its
// ASCII transliteration. Covers every Latin-1 supplement byte that maps to
// an accented Latin letter; symbols and non-letter chars are excluded so the
// caller can decide what to do with edge cases.
const TRAILING_BYTE_TO_ASCII: Record<string, string> = {
  a0: "a", // à
  a1: "a", // á
  a2: "a", // â
  a3: "a", // ã
  a4: "a", // ä
  a5: "a", // å
  a6: "ae", // æ
  a7: "c", // ç
  a8: "e", // è
  a9: "e", // é
  aa: "e", // ê
  ab: "e", // ë
  ac: "i", // ì
  ad: "i", // í
  ae: "i", // î
  af: "i", // ï
  b0: "d", // ð (Icelandic eth)
  b1: "n", // ñ
  b2: "o", // ò
  b3: "o", // ó
  b4: "o", // ô
  b5: "o", // õ
  b6: "o", // ö
  b8: "o", // ø
  b9: "u", // ù
  ba: "u", // ú
  bb: "u", // û
  bc: "u", // ü
  bd: "y", // ý
  bf: "y", // ÿ
};

const MOJIBAKE_PATTERN = /a%c2%([a-f0-9]{2})/gi;

// Return true if the input contains a mojibake fingerprint we can clean.
export function hasMojibake(input: string | undefined | null): boolean {
  if (!input) return false;
  MOJIBAKE_PATTERN.lastIndex = 0;
  return MOJIBAKE_PATTERN.test(input);
}

// Replace every `a%c2%XX` mojibake with its ASCII transliteration. Pairs
// that don't map to a Latin letter are left untouched so the caller can see
// them (they're unlikely in practice for our corpus of football team names).
export function cleanSlug(input: string): string {
  return input.replace(MOJIBAKE_PATTERN, (match, hex: string) => {
    const ascii = TRAILING_BYTE_TO_ASCII[hex.toLowerCase()];
    return ascii ?? match;
  });
}

// -----------------------------------------------------------------------------
// Double-encoded text repair.
//
// Different mojibake pattern from the slug case above: many of the post titles,
// category names and bits of WP-authored HTML in the snapshot contain valid
// UTF-8 that has been double-encoded (UTF-8 bytes were once misdecoded as
// cp1252, then the result was re-encoded as UTF-8). Visible artefacts:
//
//   "Køge"          stored as "KÃ¸ge"          (Ã = U+00C3, ¸ = U+00B8)
//   "götaland"     stored as "gÃ¶taland"
//   "Östra"        stored as "Ã–stra"          (the trail char is the
//                                                cp1252 0x96 = en-dash)
//   "Women's"      stored as "Womenâ€™s"      (U+2019 mangled to 3 chars)
//   "Italy – B"    stored as "Italy â€" B"   (the en-dash)
//
// Repair pattern-matches the exact mojibake shape and recomposes the original
// UTF-8 codepoint. Avoids whole-string byte transcoding because that breaks
// legitimate non-ASCII characters in the same string (e.g. an en-dash sitting
// outside a mojibake sequence shouldn't get touched).
// -----------------------------------------------------------------------------

// Reverse of the cp1252 -> Unicode table for the 0x80-0x9F range (where
// cp1252 differs from Latin-1). Used to map Unicode chars produced by
// cp1252 misdecoding back to the byte they came from.
const CP1252_PRINTABLE_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201e: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02c6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8a, // Š
  0x2039: 0x8b, // ‹
  0x0152: 0x8c, // Œ
  0x017d: 0x8e, // Ž
  0x2018: 0x91, // '
  0x2019: 0x92, // '
  0x201c: 0x93, // "
  0x201d: 0x94, // "
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02dc: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9a, // š
  0x203a: 0x9b, // ›
  0x0153: 0x9c, // œ
  0x017e: 0x9e, // ž
  0x0178: 0x9f, // Ÿ
};

// Trigger characters that hint the string might be double-encoded. Avoids
// running the regex passes on every clean string.
const POSSIBLE_MOJIBAKE_TEXT = /[ÂÃâ]/;

// Map a single character back to the byte it likely came from. Returns
// undefined for characters that aren't part of a known cp1252 / Latin-1
// roundtrip.
function charToByte(ch: string): number | undefined {
  const cp = ch.codePointAt(0)!;
  if (cp < 0x100) return cp;
  return CP1252_PRINTABLE_TO_BYTE[cp];
}

export function fixDoubleEncoded(input: string | undefined | null): string {
  if (!input) return input ?? "";
  if (!POSSIBLE_MOJIBAKE_TEXT.test(input)) return input;

  let out = input;

  // 3-byte UTF-8 sequences with U+00E2 (`â`) as the misdecoded lead byte.
  // Covers most punctuation like `'` (U+2019, mojibake `â€™`), the en-dash
  // (U+2013, mojibake `â€"`), `…`, `"`, `"`, `•`. Both trailing chars must
  // map back to a valid UTF-8 continuation byte for the replacement to fire.
  out = out.replace(/â(.)(.)/g, (match, c1: string, c2: string) => {
    const b1 = charToByte(c1);
    const b2 = charToByte(c2);
    if (b1 === undefined || b2 === undefined) return match;
    if ((b1 & 0xc0) !== 0x80 || (b2 & 0xc0) !== 0x80) return match;
    const codePoint = ((0xe2 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
    if (codePoint < 0x800) return match; // not a valid 3-byte UTF-8 result
    return String.fromCodePoint(codePoint);
  });

  // 2-byte UTF-8 sequences with U+00C2 (`Â`) or U+00C3 (`Ã`) as the
  // misdecoded lead byte. The trailing char can be either a Latin-1
  // supplement char (U+0080-U+00BF) or a cp1252-printable char that maps
  // back to a byte in that range (e.g. en-dash U+2013 = cp1252 0x96, so
  // `Ã` followed by en-dash decodes to `Ö`). charToByte does both lookups.
  out = out.replace(/([ÂÃ])(.)/g, (match, c1: string, c2: string) => {
    const trail = charToByte(c2);
    if (trail === undefined) return match;
    if ((trail & 0xc0) !== 0x80) return match;
    const lead = c1.charCodeAt(0);
    const codePoint = ((lead & 0x1f) << 6) | (trail & 0x3f);
    return String.fromCodePoint(codePoint);
  });

  return out;
}
