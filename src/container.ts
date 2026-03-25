import "reflect-metadata";
import { container } from "tsyringe";

// ── Services ─────────────────────────────────────────────────────────────────
import { ChatService } from "./services/chat.service";
import { EmailService } from "./services/email.service";
import { ImageService } from "./services/image.service";
import { NotificationService } from "./services/notification.service";
import { UserService } from "./services/user.service";
import { SubscriptionService } from "./services/subscription.service";
import { PaymentService } from "./services/payment.service";
import { CouponService } from "./services/coupon.service";
import { AvailabilityService } from "./services/availability.service";
import { AcademicBackgroundService } from "./services/academic-background.service";
import { WithdrawalService } from "./services/withdrawal.service";
import { SubscriptionQuotaService } from "./services/subscription-quota.service";

// ── Controllers ───────────────────────────────────────────────────────────────
import { AuthController } from "./controllers/auth.controller";
import { PaymentController } from "./controllers/payment.controller";
import { AdminPaymentController } from "./controllers/admin-payment.controller";
import { SubscriptionController } from "./controllers/subscription.controller";
import { CouponController } from "./controllers/coupon.controller";
import { AvailabilityController } from "./controllers/availability.controller";
import { AcademicBackgroundController } from "./controllers/academic-background.controller";
import { WithdrawalController } from "./controllers/withdrawal.controller";
import { NotificationController } from "./controllers/notification.controller";
import { SearchController } from "./controllers/search.controller";
import { UserProfileController } from "./controllers/user-profile.controller";
import { UserAdminController } from "./controllers/user-admin.controller";

// ── Register all services as singletons ──────────────────────────────────────
container.registerSingleton(ChatService);
container.registerSingleton(EmailService);
container.registerSingleton(ImageService);
container.registerSingleton(NotificationService);
container.registerSingleton(UserService);
container.registerSingleton(SubscriptionService);
container.registerSingleton(PaymentService);
container.registerSingleton(CouponService);
container.registerSingleton(AvailabilityService);
container.registerSingleton(AcademicBackgroundService);
container.registerSingleton(WithdrawalService);
container.registerSingleton(SubscriptionQuotaService);

// ── Register all controllers ──────────────────────────────────────────────────
container.registerSingleton(AuthController);
container.registerSingleton(UserProfileController);
container.registerSingleton(UserAdminController);
container.registerSingleton(PaymentController);
container.registerSingleton(AdminPaymentController);
container.registerSingleton(SubscriptionController);
container.registerSingleton(CouponController);
container.registerSingleton(AvailabilityController);
container.registerSingleton(AcademicBackgroundController);
container.registerSingleton(WithdrawalController);
container.registerSingleton(NotificationController);
container.registerSingleton(SearchController);

export { container };
