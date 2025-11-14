export interface PaymentResult {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  checkoutUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
  transactionId?: string;
  amount?: number;
  currency?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: any;
  error?: string;
}

export interface IPaymentService {
  /**
   * Create a new subscription
   */
  createSubscription(
    tenantId: string,
    planId: string,
    amount: number,
    billingCycle: string,
    customerEmail: string,
    paymentMethodId?: string,
  ): Promise<PaymentResult>;

  /**
   * Cancel an existing subscription
   */
  cancelSubscription(subscriptionId: string): Promise<PaymentResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<WebhookVerificationResult>;

  /**
   * Get subscription status
   */
  getSubscriptionStatus(subscriptionId: string): Promise<{
    status: string;
    currentPeriodEnd: Date;
  }>;
}
