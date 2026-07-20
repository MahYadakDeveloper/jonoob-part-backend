import { Money } from "@feature/common";

export abstract class PaymentError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Wallet balance is not enough for the requested payment amount.
 */
export class InsufficientWalletBalanceError extends PaymentError {
  constructor(
    public readonly customerId: string,
    public readonly requested: Money,
    public readonly available: Money,
  ) {
    super(
      `Insufficient wallet balance. Requested ${requested.value}, available ${available.value}.`,
    );
  }
}

/**
 * Requested wallet payment amount is zero or negative.
 */
export class InvalidWalletPaymentAmountError extends PaymentError {
  constructor(public readonly amount: Money) {
    super(`Wallet payment amount must be greater than zero.`);
  }
}

/**
 * Requested wallet payment amount exceeds invoice amount.
 */
export class WalletPaymentExceedsInvoiceError extends PaymentError {
  constructor(
    public readonly requested: Money,
    public readonly amountDue: Money,
  ) {
    super(
      `Wallet payment amount ${requested.value} exceeds invoice amount ${amountDue.value}.`,
    );
  }
}

/**
 * Wallet payment requires verification but the customer is not verified.
 */
export class WalletVerificationRequiredError extends PaymentError {
  constructor(public readonly customerId: string) {
    super(`Wallet verification is required for customer '${customerId}'.`);
  }
}

/**
 * Verification code is invalid or expired.
 */
export class InvalidWalletVerificationCodeError extends PaymentError {
  constructor() {
    super("Wallet verification code is invalid or expired.");
  }
}

/**
 * Payment method is not supported.
 */
export class UnsupportedPaymentMethodError extends PaymentError {
  constructor(public readonly paymentMethod: string) {
    super(`Unsupported payment method '${paymentMethod}'.`);
  }
}
