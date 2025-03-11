import express from "express";
import { AuthController } from "../controllers/auth.controller";

const router = express.Router();

const authController = new AuthController();

router.post("/", async (req, res) => await authController.register(req, res));
router.post("/login", async (req, res) => await authController.login(req, res));

export { router as authRouter };
