// src/config/ormconfig.ts
import { DataSource } from "typeorm";
import { UserModel } from "../models/user.model";
import { UserSettingModel } from "../models/userSetting.model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "12345",
  database: "user-service-db",
  entities: [UserModel, UserSettingModel],
  synchronize: true,
});

AppDataSource.initialize().then(() => {
  console.log("Database connected");
});
