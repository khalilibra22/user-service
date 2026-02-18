import { PaymentProviderInterface } from "../../interfaces/payment-provider.interface";
import { getLogger } from "../../utils/logger";

const log = getLogger();

export class SatimProvider implements PaymentProviderInterface {
    private readonly gatewayUrl = "https://test.satim.dz/payment/rest"; // Example URL
    private readonly userName = process.env.SATIM_USERNAME || "satim_user";
    private readonly password = process.env.SATIM_PASSWORD || "satim_pass";

    async initiatePayment(
        amount: number,
        currency: string,
        orderId: string,
        returnUrl: string,
        failUrl: string,
        language: string = "fr"
    ): Promise<{ paymentUrl: string; externalId?: string }> {
        log.info(
            { amount, currency, orderId },
            "Initiating SATIM payment (MOCK)"
        );

        // In a real implementation, we would call register.do here
        // const response = await axios.post(`${this.gatewayUrl}/register.do`, { ... });

        // MOCK RESPONSE
        return {
            paymentUrl: `${this.gatewayUrl}/mock-payment-page?orderId=${orderId}&amount=${amount}`,
            externalId: `satim-ext-${orderId}-${Date.now()}`,
        };
    }

    async verifyPayment(
        externalId: string
    ): Promise<{ status: "success" | "failed" | "pending"; externalId?: string }> {
        log.info({ externalId }, "Verifying SATIM payment (MOCK)");

        // In a real implementation, we would call confirmOrder.do here

        // MOCK: Always return success for now for testing
        return {
            status: "success",
            externalId
        };
    }
}
