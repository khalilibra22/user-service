import express from "express";
import { SearchController } from "../../controllers/search.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { nearbyUsersQueryValidationSchema } from "../../validations/user.validation";

const router = express.Router();

const searchController = new SearchController();

router.get(
  "/",
  //AuthMiddleware.verifyToken,
  searchController.searchTeachersAndAcademies
);

// Get nearby teachers and academies
router.get(
  "/nearby",
  ValidationMiddleware.validateQuery(nearbyUsersQueryValidationSchema),
  searchController.getNearbyTeachers
);

export { router as searchRouter };
