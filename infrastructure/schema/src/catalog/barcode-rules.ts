// Single source of truth. Patterns are plain strings so JS and Postgres
// receive identical text. Keep them in the common JS/POSIX subset
// (character classes, {n,m}, anchors; no \d, lookahead or flags).
export const BARCODE_PATTERNS = {
  UPC_A: '^[0-9]{12}$',
  UPC_E: '^[01][0-9]{7}$', // number system must be 0 or 1
  EAN_13: '^[0-9]{13}$',
  EAN_8: '^[0-9]{8}$',
  GTIN_14: '^[0-9]{14}$', // ITF-14, usually on cartons
  CODE_39: '^[0-9A-Z. $/+%-]{1,64}$',
  CODE_93: '^[0-9A-Z. $/+%-]{1,64}$',
  CODE_128: '^[ -~]{1,64}$',
  CODABAR: '^[A-D][0-9$:/.+-]{1,62}[A-D]$',
} as const;

export type BarcodeType = keyof typeof BARCODE_PATTERNS;
export const BARCODE_TYPES = Object.keys(BARCODE_PATTERNS) as [
  BarcodeType,
  ...BarcodeType[],
];
