import express from "express";
import Indexcontroller from "../controllers/indexController.js";
import passport from '../middleware/passportAuth.middleware.js';

const router = express.Router();

router.get("/get-all-attendance", passport.authenticate('jwt', { session: false }), Indexcontroller.Attendance.getAllAttendance);
//router.get("/attendance/user/:deviceId/:userId", passport.authenticate('jwt', { session: false }), Indexcontroller.Attendance.getAttendanceByUid);

export default router;