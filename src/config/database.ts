// src/config/ormconfig.ts
import { DataSource } from "typeorm";
import { UserModel } from "../models/user.model";
import { UserSettingModel } from "../models/user-setting.model";
import { AcademicBackgroundModel } from "../models/academic-background.model";
import { CategoryModel } from "../models/category.model";
import { TopicModel } from "../models/topic.model";
import { PaymentMethodModel } from "../models/payment-method.model";
import { SubjectModel } from "../models/subject.model";
import { UserTopicModel } from "../models/user-topic.model";
import { PlanModel } from "../models/plan.model";
import { SubscriptionModel } from "../models/subscription.model";
import { AvailabilityModel } from "../models/availability.model";
import { AvailabilityExceptionModel } from "../models/availability-exception.model";
import { CouponModel } from "../models/coupon.model";
import { TransactionModel } from "../models/transaction.model";
import { UserWalletModel } from "../models/user-wallet.model";
import { EarningModel } from "../models/earning.model";
import { WithdrawalModel } from "../models/withdrawal-request.model";
import { WalletTransactionModel } from "../models/wallet-transaction.model";

import config from ".";

export const AppDataSource = new DataSource({
  type: config.db.type,
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  entities: [
    UserModel,
    UserSettingModel,
    AcademicBackgroundModel,
    CategoryModel,
    SubjectModel,
    TopicModel,
    UserTopicModel,
    PaymentMethodModel,
    PlanModel,
    SubscriptionModel,
    AvailabilityModel,
    AvailabilityExceptionModel,
    CouponModel,
    TransactionModel,
    UserWalletModel,
    EarningModel,
    WithdrawalModel,
    WalletTransactionModel
  ],
  synchronize: config.env === "development",
  // Add cache configuration
  cache: config.redis.enabled
    ? {
      type: "ioredis",
      options: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
      duration: config.redis.cacheDuration,
    }
    : false,
});

import { getLogger } from "../utils/logger";

const logger = getLogger();

AppDataSource.initialize()
  .then(() => {
    logger.info("Database connected");
  })
  .catch((error) => {
    logger.error({ err: error }, "Database connection error");
  });
