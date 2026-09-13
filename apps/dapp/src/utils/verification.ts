import crypto from 'crypto';

const DEFAULT_TOKEN_BYTES = 32;
// Default OTP length used by generateCode() when no override is provided.
const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_TOKEN_EXPIRES_IN_MINUTES = 15;
// Bound length to avoid unsafe integer ranges in randomInt(0, 10^length).
const MIN_VERIFICATION_CODE_LENGTH = 1;
const MAX_VERIFICATION_CODE_LENGTH = 14;

export class Verification {
  static generateCode(length: number = VERIFICATION_CODE_LENGTH): string {
    if (
      length < MIN_VERIFICATION_CODE_LENGTH ||
      length > MAX_VERIFICATION_CODE_LENGTH
    ) {
      throw new Error(
        `Verification code length must be between ${MIN_VERIFICATION_CODE_LENGTH} and ${MAX_VERIFICATION_CODE_LENGTH}`,
      );
    }

    // Generate a numeric code and left-pad with zeros so output is fixed-length.
    const max = 10 ** length;
    return crypto.randomInt(0, max).toString().padStart(length, '0');
  }

  static generateToken(bytes: number = DEFAULT_TOKEN_BYTES): string {
    if (bytes <= 0) throw new Error('Token bytes must be positive');
    return crypto.randomBytes(bytes).toString('hex');
  }

  static getExpirationDate(): Date {
    const expiresAt = new Date();
    // Verification tokens are short-lived to reduce replay risk.
    expiresAt.setMinutes(
      expiresAt.getMinutes() + VERIFICATION_TOKEN_EXPIRES_IN_MINUTES,
    );
    return expiresAt;
  }
}
