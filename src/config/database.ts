// src/config/ormconfig.ts
import { DataSource } from "typeorm";
import { UserModel } from "../models/user.model";
import { UserSettingModel } from "../models/userSetting.model";
import { AcademicBackgroundModel } from "../models/academicBackground.model";
import { CategoryModel } from "../models/category.model";
import { TopicModel } from "../models/topic.model";
import { PaymentMethodModel } from "../models/paymentMethod.model";
import { SubjectModel } from "../models/subject.model";
import { UserTopicModel } from "../models/userTopic.model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "pg-2a2ac9b9-ibrakhalilo22-4c7b.f.aivencloud.com",
  port: 12183,
  username: "avnadmin",
  password: "AVNS_0vhpVNq82FydIBgv2ow",
  database: "defaultdb",
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
  ],
  synchronize: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Database connection error", error);
  });
