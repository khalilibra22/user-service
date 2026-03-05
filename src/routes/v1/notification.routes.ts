import { Router, Request, Response, NextFunction } from "express";
import { NotificationController } from "../../controllers/notification.controller";
import config from "../../config";

const router = Router();
const notificationController = new NotificationController();

// Middleware to check internal API key
const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers["x-internal-api-key"];
    if (apiKey !== config.apiKeys.userService) {
        res.status(403).json({ error: "Forbidden: Invalid internal API key" });
        return;
    }
    next();
};

router.use(internalAuth as any);

// Trigger enrollment notification
router.post("/enrollment", notificationController.sendEnrollmentNotification);

// Trigger payment notification
router.post("/payment", notificationController.sendPaymentNotification);

// Trigger unread message notification
router.post("/unread-message", notificationController.sendUnreadMessageNotification);

export default router;
