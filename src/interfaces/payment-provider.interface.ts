export interface PaymentProviderInterface {
    initiatePayment(
        amount: number,
        currency: string,
        orderId: string,
        returnUrl: string,
        failUrl: string,
        language?: string
    ): Promise<{ paymentUrl: string; externalId?: string }>;

    verifyPayment(
        externalId: string
    ): Promise<{ status: "success" | "failed" | "pending"; externalId?: string }>;
}
