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

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "pg-2a2ac9b9-ibrakhalilo22-4c7b.f.aivencloud.com",
  port: 12183,
  username: "avnadmin",
  password: "AVNS_0vhpVNq82FydIBgv2ow",
  database: "user-service-db",
  ssl: { rejectUnauthorized: false },
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
  ],
  synchronize: true,
  // Add cache configuration
  cache: false,
  // cache: {
  //   type: "ioredis",
  //   options: {
  //     host: "redis-13699.c135.eu-central-1-1.ec2.redns.redis-cloud.com", // Your Redis host
  //     port: 13699, // Your Redis port
  //     password: "ttpcXXzePDYevUgWEQ7lxgNCrZWb5Oao", // Redis password if any
  //   },
  //   duration: 60000, // Cache duration in milliseconds (1 minute)
  // },
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
