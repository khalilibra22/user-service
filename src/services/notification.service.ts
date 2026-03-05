import { EmailService } from "./email.service";
import { getLogger } from "../utils/logger";

const log = getLogger();

export class NotificationService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<boolean> {
        const subject = "Réinitialisation de votre mot de passe";
        return this.emailService.sendEmail(email, subject, "password-reset", {
            name,
            resetUrl,
        });
    }

    async sendEnrollmentConfirmation(email: string, name: string, courseName: string): Promise<boolean> {
        const subject = "Confirmation d'inscription à votre cours";
        return this.emailService.sendEmail(email, subject, "enrollment", {
            name,
            courseName,
        });
    }

    async sendPaymentSuccess(
        email: string,
        name: string,
        amount: number,
        currency: string,
        itemName: string,
        transactionId: string
    ): Promise<boolean> {
        const subject = "Votre reçu de paiement";
        return this.emailService.sendEmail(email, subject, "payment", {
            name,
            amount,
            currency,
            itemName,
            transactionId,
            frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
        });
    }

    async sendUnreadMessageAlert(
        email: string,
        name: string,
        senderName: string
    ): Promise<boolean> {
        const subject = "Nouveau message sur le chat";
        return this.emailService.sendEmail(email, subject, "unread-message", {
            name,
            senderName,
        });
    }

    async sendEmailVerification(
        email: string,
        name: string,
        verificationUrl: string
    ): Promise<boolean> {
        const subject = "Vérifiez votre adresse e-mail";
        return this.emailService.sendEmail(email, subject, "verify-email", {
            name,
            verificationUrl,
        });
    }

    renderTemplate(templateName: string, context: any): string | null {
        return this.emailService.renderTemplate(templateName, context);
    }
}
