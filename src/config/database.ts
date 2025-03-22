// src/config/ormconfig.ts
import { DataSource } from "typeorm";
import { UserModel } from "../models/user.model";
import { UserSettingModel } from "../models/userSetting.model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "pg-2a2ac9b9-ibrakhalilo22-4c7b.f.aivencloud.com",
  port: 12183,
  username: "avnadmin",
  password: "AVNS_0vhpVNq82FydIBgv2ow",
  database: "defaultdb",
  ssl: { rejectUnauthorized: false },
  entities: [UserModel, UserSettingModel],
  synchronize: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Database connection error", error);
  });
