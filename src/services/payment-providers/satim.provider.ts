import { PaymentProviderInterface } from "../../interfaces/payment-provider.interface";
import { getLogger } from "../../utils/logger";
import axios from "axios";

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
            "Initiating SATIM payment via register.do"
        );

        try {
            const params = new URLSearchParams();
            params.append("userName", this.userName);
            params.append("password", this.password);
            params.append("orderNumber", orderId);
            params.append("amount", (amount * 100).toString()); // Amount in cents
            params.append("currency", "604"); // DZD
            params.append("returnUrl", returnUrl);
            params.append("failUrl", failUrl);
            params.append("language", language);
            params.append("pageView", "DESKTOP");

            const response = await axios.post(`${this.gatewayUrl}/register.do`, params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (response.data.errorCode && response.data.errorCode !== "0") {
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
            params.append("orderId", externalId);

            const response = await axios.post(`${this.gatewayUrl}/getOrderStatusExtended.do`, params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            // Transaction status:
            // 0: Initialized
            // 1: Wait for 3D Secure
            // 2: Success
            // 3: Canceled
            // 4: Rejected
            // 5: Timeout
            // 6: Refunded

            const errorCode = response.data.errorCode;
            const transactionStatus = response.data.transactionStatus;

            if (errorCode && errorCode !== "0" && errorCode !== "2") {
                // errorCode 2 means "Order not found" usually if we check too early or with wrong ID
                log.warn({ data: response.data, externalId }, "SATIM verify status warning");
            }

            if (transactionStatus === 2) {
                return { status: "success", externalId };
            } else if ([3, 4, 5].includes(transactionStatus)) {
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
