// src/config/ormconfig.ts
import { DataSource } from "typeorm";
import { UserModel } from "../models/user.model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "12345",
  database: "user-service-db",
  entities: [UserModel],
  synchronize: true, // Set to false in production
});

AppDataSource.initialize().then(() => {
  console.log("Database connected");
});
