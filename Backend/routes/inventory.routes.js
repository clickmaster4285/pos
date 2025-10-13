import express from "express";
import Indexcontroller from "../controllers/indexController.js";
import passport from "../middleware/passportAuth.middleware.js";
import { checkplan, checkPermissionsValidation, checkPlanIsActive } from "../middleware/authMiddleware.js";
import ErrorResponse from "../utils/errorResponse.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-inventory",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation("createInventory"),
  checkplan("Inventory"),
  Indexcontroller.Inventory.createInventory
);

router.patch(
  "/update-info-inventory/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation("updateInventory"),
  checkplan("Inventory"),
  Indexcontroller.Inventory.updateInfo
);

router.put(
  "/add-stock-inventory/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
    checkPlanIsActive,
  checkPermissionsValidation("createInventory"),
  checkplan("Inventory"),
  Indexcontroller.Inventory.addStock
);

router.get(
  "/get-all-inventories",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation("viewInventory"),
  Indexcontroller.Inventory.getAllInventoryItems
);

router.get(
  "/get-inventory-by-id/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation("viewInventory"),
  Indexcontroller.Inventory.getInventoryItemById
);

router.patch(
  "/update-inventory-item/:inventoryId/:historyId",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation("updateInventory"),
  checkplan("Inventory"),
  Indexcontroller.Inventory.updateInventoryItem
);

router.delete(
  "/delete-inventory-item/:id",
  passport.authenticate("jwt", { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation("deleteInventory"),
  checkplan("Inventory"),
  Indexcontroller.Inventory.deleteInventoryItem
);


export default router;
