import express from "express";
import { AuthMiddleware } from "../utils/auth.middleware";
import { SearchController } from "../controllers/search.controller";

const router = express.Router();

const searchController = new SearchController();

router.get(
  "/",
  //AuthMiddleware.verifyToken,
  searchController.searchTeachersAndAcademies
);

export { router as searchRouter };
