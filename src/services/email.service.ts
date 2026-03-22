import { injectable } from "tsyringe";
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import config from "../config";
import { getLogger } from "../utils/logger";

const log = getLogger();

@injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.port === 465, // true for 465, false for other ports
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
        });

        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            if (config.smtp.user && config.smtp.pass) {
                await this.transporter.verify();
                log.info("[EmailService] SMTP connection verified");
            } else {
                log.warn("[EmailService] SMTP credentials not provided. Email sending might fail.");
            }
        } catch (error) {
            log.error({ err: error }, "[EmailService] SMTP connection failed");
        }
    }

    async sendEmail(
        to: string,
        subject: string,
        templateName: string,
        context: any
    ): Promise<boolean> {
        try {
            const html = this.renderTemplate(templateName, context);
            if (!html) return false;

            const mailOptions = {
                from: config.smtp.from,
                to,
                subject,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            log.info({ messageId: info.messageId, to, subject }, "[EmailService] Email sent successfully");
            return true;
        } catch (error) {
            log.error({ err: error, to, subject, templateName }, "[EmailService] Error sending email");
            return false;
        }
    }

    renderTemplate(templateName: string, context: any): string | null {
        try {
            const templatePath = path.join(__dirname, "../templates", `${templateName}.hbs`);

            if (!fs.existsSync(templatePath)) {
                log.error({ templatePath }, "[EmailService] Template not found");
                return null;
            }

            const templateSource = fs.readFileSync(templatePath, "utf8");
            const template = handlebars.compile(templateSource);
            return template(context);
        } catch (error) {
            log.error({ err: error, templateName }, "[EmailService] Error rendering template");
            return null;
        }
    }
}
