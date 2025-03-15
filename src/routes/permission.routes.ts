import express from "express";
import { PermissionController } from "../controllers/permission.controller";

const router = express.Router();

const permissionController = new PermissionController();

export { router as permissionRouter };
