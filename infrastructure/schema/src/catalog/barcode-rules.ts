// Single source of truth. Patterns are plain strings so JS and Postgres
// receive identical text. Keep them in the common JS/POSIX subset
// (character classes, {n,m}, anchors; no \d, lookahead or flags).
export const BARCODE_PATTERNS = {
  UPC_A: '^[0-9]{12}$',
  UPC_E: '^[0-9]{8}$',
  EAN_13: '^[0-9]{13}$',
  EAN_8: '^[0-9]{8}$',
  Code39: '^[0-9A-Z. $/+%-]{1,64}$',
  Code93: '^[0-9A-Z. $/+%-]{1,64}$',
  Code128: '^[ -~]{1,64}$',
  Codabar: '^[A-D][0-9$:/.+-]{1,62}[A-D]$',
} as const;

export type BarcodeType = keyof typeof BARCODE_PATTERNS;
export const BARCODE_TYPES = Object.keys(BARCODE_PATTERNS) as [
  BarcodeType,
  ...BarcodeType[],
];

// Canonical form = trimmed + upper-cased, except for this case-sensitive type.
export const CASE_SENSITIVE_TYPE = 'Code128' satisfies BarcodeType;

export const normalizeBarcode = (type: BarcodeType, value: string) => {
  const v = value.trim();
  return type === CASE_SENSITIVE_TYPE ? v : v.toUpperCase();
};

export const isValidBarcode = (type: BarcodeType, value: string) =>
  new RegExp(BARCODE_PATTERNS[type]).test(value);
