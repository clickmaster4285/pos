import express from "express";
import authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { verifyOTP } from "../utils/generate_verifyOTP.js";

const router = express.Router();

router.post("/login", authController.login);
router.delete("/logout", authController.logout);
router.get("/me", authenticateToken, authController.getme);
router.post("/refresh", authController.refreshToken);
router.post("/register", authController.registerUser);
router.post("/verify-email", verifyOTP);
export default router;
