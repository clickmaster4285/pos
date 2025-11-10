import express from "express";
import Indexcontroller from "../controllers/indexController.js";
import passport from "../middleware/passportAuth.middleware.js";
import ErrorResponse from "../utils/errorResponse.js";
import { checkOrderValidation } from "../middleware/authMiddleware.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { checkPermissionsValidation } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post(
  "/create-category",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPermissionsValidation("createCategory"),
  Indexcontroller.Category.createCategory
);

router.get(
  "/get-all-category",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPermissionsValidation("viewCategory"),
  Indexcontroller.Category.getAllCategory
);

router.patch(
  "/update-category/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPermissionsValidation("updateCategory"),
  Indexcontroller.Category.updateCategory
);

router.delete(
  "/delete-category/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPermissionsValidation("deleteCategory"),
  Indexcontroller.Category.deleteCategory
);

router.patch(
  "/status-update-category/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPermissionsValidation("updateCategory"),
  Indexcontroller.Category.toggleCategoryStatus
);
export default router;
