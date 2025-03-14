import express from "express";
import { PermissionController } from "../controllers/permission.controller";

const router = express.Router();

const permissionController = new PermissionController();

router.post(
  "/",
  async (req, res) => await permissionController.createPermission(req, res)
);
router.get(
  "/:id",
  async (req, res) => await permissionController.getPermissionById(req, res)
);

export { router as permissionRouter };
