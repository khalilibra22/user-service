import express from "express";
import { SearchController } from "../../controllers/search.controller";

const router = express.Router();

const searchController = new SearchController();

router.get(
  "/",
  //AuthMiddleware.verifyToken,
  searchController.searchTeachersAndAcademies
);

export { router as searchRouter };
