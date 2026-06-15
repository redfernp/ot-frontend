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
