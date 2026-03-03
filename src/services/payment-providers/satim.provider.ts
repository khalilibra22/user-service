import { PaymentProviderInterface } from "../../interfaces/payment-provider.interface";
import { getLogger } from "../../utils/logger";
import axios from "axios";

const log = getLogger();

export class SatimProvider implements PaymentProviderInterface {
    private readonly gatewayUrl = "https://test2.satim.dz/payment/rest"; // Updated for Satim Test Env
    private readonly userName = process.env.SATIM_USERNAME || "satim_user";
    private readonly password = process.env.SATIM_PASSWORD || "satim_pass";
    private readonly terminalId = process.env.SATIM_TERMINAL_ID || "0000000000"; // Identifiant terminal

    async initiatePayment(
        amount: number,
        currency: string,
        orderId: string,
        returnUrl: string,
        failUrl: string,
        language: string = "fr"
    ): Promise<{ paymentUrl: string; externalId?: string }> {
        const orderNumber = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
        log.info(
            { amount, currency, orderNumber },
            "Initiating SATIM payment via register.do"
        );

        try {
            const params = new URLSearchParams();
            params.append("userName", this.userName);
            params.append("password", this.password);
            params.append("orderNumber", orderNumber);
            params.append("amount", (amount * 100).toString()); // Amount in cents
            params.append("currency", "012"); // 012 is the test currency code required by Satim test environment
            params.append("returnUrl", returnUrl);
            params.append("description", "Payment for order " + orderNumber);
            params.append("failUrl", failUrl);
            params.append("language", "FR");
            // Add the Terminal ID (Identifiant terminal) as required by SATIM
            params.append("jsonParams", JSON.stringify({ force_terminal_id: this.terminalId, udf1: orderNumber }));

            const response = await axios.get(`${this.gatewayUrl}/register.do`, { params });

            if (response.data && response.data.errorCode && response.data.errorCode !== 0 && response.data.errorCode !== "0") {
                log.error({ data: response.data }, "SATIM register.do failed");
                throw new Error(response.data.errorMessage || "SATIM payment initiation failed");
            }

            return {
                paymentUrl: response.data.formUrl,
                externalId: response.data.orderId,
            };
        } catch (error: any) {
            log.error({ err: error }, "Error calling SATIM register.do");
            throw error;
        }
    }

    async verifyPayment(
        externalId: string
    ): Promise<{ status: "success" | "failed" | "pending"; externalId?: string }> {
        log.info({ externalId }, "Verifying SATIM payment via getOrderStatusExtended.do");

        try {
            const params = new URLSearchParams();
            params.append("userName", this.userName);
            params.append("password", this.password);
            params.append("mdOrder", externalId);
            params.append("language", "FR");



            const response = await axios.get(`${this.gatewayUrl}/public/acknowledgeTransaction.do`, { params });

            // Order status:
            // 0: Initialized
            // 1: Wait for 3D Secure
            // 2: Success
            // 3: Canceled
            // 4: Rejected
            // 5: Timeout
            // 6: Refunded

            const errorCode = response.data.ErrorCode ?? response.data.errorCode;
            const OrderStatus = response.data.OrderStatus;

            // Log any SATIM error
            if (errorCode && errorCode !== 0 && errorCode !== "0") {
                log.warn({ data: response.data, externalId }, "SATIM verify returned non-zero ErrorCode");
            }

            if (OrderStatus === 2 || OrderStatus === "2") {
                return { status: "success", externalId };
            } else if ([3, 4, 5, "3", "4", "5"].includes(OrderStatus)) {
                return { status: "failed", externalId };
            } else {
                return { status: "pending", externalId };
            }
        } catch (error: any) {
            log.error({ err: error, externalId }, "Error calling SATIM getOrderStatusExtended.do");
            return { status: "pending", externalId };
        }
    }
}
