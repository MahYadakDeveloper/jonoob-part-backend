import { hmacSha256 } from '@infra/crypto/hmac';

export const otpDigest = (
  secret: string,
  challengeId: string,
  phone: string,
  code: string,
) => hmacSha256(secret, 'otp', challengeId, phone, code);

export function encodeDigest(digest: Buffer): string {
  return digest.toString('hex');
}

export function decodeDigest(stored: string): Buffer {
  return Buffer.from(stored, 'hex');
}
