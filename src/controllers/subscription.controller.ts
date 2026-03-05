import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { SubscriptionService } from "../services/subscription.service";
import { getDurationInMonths } from "../utils";
import { plainToInstance } from "class-transformer";
import { PlanDto } from "../dtos/plan.dto";
import { SubscriptionDto } from "../dtos/subscription.dto";
import { getLogger } from "../utils/logger";
import { PaymentService } from "../services/payment.service";
import { PaymentMethod } from "../enums/payment-method.enum";

export class SubscriptionController {
  private subscriptionService: SubscriptionService;
  private userService: UserService;
  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.userService = new UserService();
  }

  createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await this.subscriptionService.createPlan(req.body);
      const planDto = plainToInstance(PlanDto, plan, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(planDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error creating plan');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await this.subscriptionService.updatePlan(req.params.planId, req.body);
      const planDto = plainToInstance(PlanDto, plan, { excludeExtraneousValues: true });
      res.status(200).json(planDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error updating plan');
      if (error.message === "Plan not found") {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  deactivatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await this.subscriptionService.deactivatePlan(req.params.planId);
      const planDto = plainToInstance(PlanDto, plan, { excludeExtraneousValues: true });
      res.status(200).json(planDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error deactivating plan');
      if (error.message === "Plan not found") {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = res.locals.user?.id;
      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const planId = req.params.planId;
      const plan = await this.subscriptionService.getPlanById(planId);
      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }

      // Guard: prevent duplicate active subscription for the same plan
      const existingActive = await this.subscriptionService.getActiveSubscriptionByUserAndPlan(userId, planId);
      if (existingActive) {
        res.status(409).json({ error: "User already has an active subscription for this plan" });
        return;
      }

      const isFree = !plan.price || plan.price === 0;

      const subscriptionBody = {
        // startDate and endDate are set at activation, not creation
        plan: plan,
        user: user,
        status: isFree ? "active" : "pending_payment"
      };

      // For free plans, set dates immediately since there's no payment step
      if (isFree) {
        const durationInMonths = getDurationInMonths(plan.duration, plan.durationUnit);
        (subscriptionBody as any).startDate = new Date();
        (subscriptionBody as any).endDate = new Date(
          new Date().setMonth(new Date().getMonth() + durationInMonths)
        );
      }

      const subscription = await this.subscriptionService.createSubscription(subscriptionBody);

      const subscriptionDto = plainToInstance(SubscriptionDto, subscription, {
        excludeExtraneousValues: true,
      });

      // If free, update user plan immediately and return
      if (isFree) {
        user.plan = plan;
        await this.userService.updateUser(userId, user);
        res.status(201).json(subscriptionDto);
        return;
      }

      // If paid, initiate payment — dates will be set by activateSubscription on success
      const paymentService = new PaymentService();

      const { paymentUrl, transactionId, message, discount } = await paymentService.initiateTransaction({
        userId: userId,
        amount: plan.price!,
        method: req.body.paymentMethod || PaymentMethod.SATIM,
        referenceType: "SUBSCRIPTION",
        referenceId: subscription.id!.toString(),
        description: `Subscription to ${plan.name} Plan for User ${user.fullname || user.id}`,
        couponCode: req.body.couponCode,
      });

      res.status(201).json({
        subscription: subscriptionDto,
        paymentUrl,
        transactionId,
        message,
        ...(discount && { discount }),
      });

    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error creating subscription');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  cancelSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const subscriptionId = req.params.subscriptionId;
      const userId = res.locals.user?.id;

      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }

      const subscription = await this.subscriptionService.cancelSubscription(subscriptionId, userId);
      const subscriptionDto = plainToInstance(SubscriptionDto, subscription, { excludeExtraneousValues: true });
      res.status(200).json(subscriptionDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error cancelling subscription');
      if (error.message === "Subscription not found") {
        res.status(404).json({ error: "Subscription not found" });
        return;
      }
      if (error.message?.startsWith("Unauthorized")) {
        res.status(403).json({ error: error.message });
        return;
      }
      if (error.message === "Subscription is already cancelled") {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  renewSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = res.locals.user?.id;
      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }

      const { newSubscription, plan, renewsFrom } = await this.subscriptionService.renewSubscription(userId);

      const isFree = !plan.price || plan.price === 0;

      if (isFree) {
        // Free plan: just activate immediately
        const activated = await this.subscriptionService.activateRenewalSubscription(newSubscription.id!, renewsFrom);
        res.status(200).json({ subscription: plainToInstance(SubscriptionDto, activated, { excludeExtraneousValues: true }) });
        return;
      }

      const paymentService = new PaymentService();
      const { paymentUrl, transactionId, message, discount } = await paymentService.initiateTransaction({
        userId,
        amount: plan.price!,
        method: req.body.paymentMethod || PaymentMethod.SATIM,
        referenceType: "SUBSCRIPTION",
        referenceId: newSubscription.id!.toString(),
        description: `Renewal of ${plan.name} Plan`,
        couponCode: req.body.couponCode,
        // Store renewsFrom so post-payment handler can use it
        metadata: { renewsFrom: renewsFrom.toISOString(), isRenewal: true },
      });

      res.status(201).json({
        subscription: plainToInstance(SubscriptionDto, newSubscription, { excludeExtraneousValues: true }),
        paymentUrl,
        transactionId,
        message,
        renewsFrom,
        ...(discount && { discount }),
      });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error renewing subscription');
      if (error.message === "No existing subscription found to renew") {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = res.locals.user?.id;
      const newPlanId = req.params.planId;

      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }

      const { newSubscription, plan } = await this.subscriptionService.upgradeSubscription(userId, newPlanId);

      const paymentService = new PaymentService();
      const { paymentUrl, transactionId, message, discount } = await paymentService.initiateTransaction({
        userId,
        amount: plan.price!,
        method: req.body.paymentMethod || PaymentMethod.SATIM,
        referenceType: "SUBSCRIPTION",
        referenceId: newSubscription.id!.toString(),
        description: `Upgrade to ${plan.name} Plan`,
        couponCode: req.body.couponCode,
      });

      res.status(201).json({
        subscription: plainToInstance(SubscriptionDto, newSubscription, { excludeExtraneousValues: true }),
        paymentUrl,
        transactionId,
        message,
        ...(discount && { discount }),
      });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error upgrading subscription');
      if (error.message.includes("No active subscription") || error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes("not an upgrade")) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  downgradeSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = res.locals.user?.id;
      const newPlanId = req.params.planId;

      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }

      const { subscription, scheduledPlan } = await this.subscriptionService.downgradeSubscription(userId, newPlanId);

      res.status(200).json({
        subscription: plainToInstance(SubscriptionDto, subscription, { excludeExtraneousValues: true }),
        message: `Your plan will switch to ${scheduledPlan.name} at the end of your current billing period on ${subscription.endDate?.toISOString().split("T")[0]}.`,
        scheduledPlan: plainToInstance(PlanDto, scheduledPlan, { excludeExtraneousValues: true }),
        effectiveDate: subscription.endDate,
      });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error downgrading subscription');
      if (error.message.includes("No active subscription") || error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes("not a downgrade") || error.message.includes("already scheduled")) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const plans = await this.subscriptionService.getPlans();
      const planDtos = plainToInstance(PlanDto, plans, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(planDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error fetching plans');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      const subscriptions = await this.subscriptionService.getAllSubscriptionsByUserId(userId);
      const subscriptionDtos = plainToInstance(SubscriptionDto, subscriptions, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(subscriptionDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error fetching user subscriptions');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  getActiveSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const subscriptions = await this.subscriptionService.getActiveSubscriptions();
      const subscriptionDtos = plainToInstance(SubscriptionDto, subscriptions, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(subscriptionDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error fetching active subscriptions');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
