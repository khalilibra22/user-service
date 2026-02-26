import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { getLogger } from "../utils/logger";

const log = getLogger();

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    // Trigger enrollment notification
    sendEnrollmentNotification = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, name, courseName } = req.body;
            if (!email || !name || !courseName) {
                res.status(400).json({ error: "Missing required fields" });
                return;
            }

            const success = await this.notificationService.sendEnrollmentConfirmation(email, name, courseName);
            if (success) {
                res.json({ message: "Enrollment notification sent" });
            } else {
                res.status(500).json({ error: "Failed to send notification" });
            }
        } catch (error) {
            log.error({ err: error }, "[NotificationController] Error in sendEnrollmentNotification");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // Trigger payment notification
    sendPaymentNotification = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, name, amount, currency, itemName, transactionId } = req.body;
            if (!email || !name || !amount || !currency || !itemName || !transactionId) {
                res.status(400).json({ error: "Missing required fields" });
                return;
            }

            const success = await this.notificationService.sendPaymentSuccess(email, name, amount, currency, itemName, transactionId);
            if (success) {
                res.json({ message: "Payment notification sent" });
            } else {
                res.status(500).json({ error: "Failed to send notification" });
            }
        } catch (error) {
            log.error({ err: error }, "[NotificationController] Error in sendPaymentNotification");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // Trigger unread message notification
    sendUnreadMessageNotification = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, name, senderName } = req.body;
            if (!email || !name || !senderName) {
                res.status(400).json({ error: "Missing required fields" });
                return;
            }

            const success = await this.notificationService.sendUnreadMessageAlert(email, name, senderName);
            if (success) {
                res.json({ message: "Unread message notification sent" });
            } else {
                res.status(500).json({ error: "Failed to send notification" });
            }
        } catch (error) {
            log.error({ err: error }, "[NotificationController] Error in sendUnreadMessageNotification");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}
