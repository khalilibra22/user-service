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
      (req.log || getLogger()).error({ err: error }, 'Error in subscription operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.body.userId;
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

      const isFree = !plan.price || plan.price === 0;
      const durationInMonths = getDurationInMonths(
        plan.duration,
        plan.durationUnit
      );

      const subscriptionBody = {
        startDate: new Date(),
        endDate: new Date(
          new Date(
            new Date().setMonth(new Date().getMonth() + durationInMonths)
          )
        ),
        plan: plan,
        user: user,
        status: isFree ? "active" : "pending_payment"
      };

      const subscription = await this.subscriptionService.createSubscription(
        subscriptionBody
      );

      const subscriptionDto = plainToInstance(SubscriptionDto, subscription, {
        excludeExtraneousValues: true,
      });

      // If free, return subscription as before
      if (isFree) {
        user.plan = plan;
        await this.userService.updateUser(userId, user);
        res.status(201).json(subscriptionDto);
        return;
      }

      // If paid, initiate payment
      const paymentService = new PaymentService(); // Instantiate here since we didn't inject it globally yet in this file

      const { paymentUrl, transactionId, message } = await paymentService.initiateTransaction({
        userId: userId,
        amount: plan.price!,
        currency: "DZD",
        method: req.body.paymentMethod || PaymentMethod.SATIM,
        referenceType: "SUBSCRIPTION",
        referenceId: subscription.id!.toString(),
        description: `Subscription to ${plan.name} Plan for User ${user.fullname || user.id}`,
        returnUrl: req.body.returnUrl || `http://localhost:3000/payment/success?type=subscription`, // Default or from body
        failUrl: req.body.failUrl || `http://localhost:3000/payment/fail`,
      });

      res.status(201).json({
        subscription: subscriptionDto,
        paymentUrl,
        transactionId,
        message
      });

    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in subscription operation');
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
      (req.log || getLogger()).error({ err: error }, 'Error in subscription operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  getActiveSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const subscriptions =
        await this.subscriptionService.getActiveSubscriptions();
      const subscriptionDtos = plainToInstance(SubscriptionDto, subscriptions, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(subscriptionDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in subscription operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
