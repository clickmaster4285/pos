import express from "express";
import authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { verifyOTP } from "../utils/generate_verifyOTP.js";
import  resendOtp  from "../utils/sendEmail.js";
import passport from '../middleware/passportAuth.middleware.js';

const router = express.Router();

router.post("/login", authController.login);
router.delete("/logout", authController.logout);
router.get("/me", passport.authenticate('jwt', { session: false }), authController.getme);
router.post("/refresh", authController.refreshToken);
router.post("/register", authController.registerUser);
router.post("/verify-email", verifyOTP);
router.post('/resend-otp', resendOtp);          // ← new
export default router;
