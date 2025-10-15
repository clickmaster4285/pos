import express from 'express';
import rateLimit from 'express-rate-limit';
import authRouter from './auth.routes.js';
import Company from './company.route.js';
import Plan from './plan.route.js';
import User from './user.route.js';
import Vendor from './vendor.routes.js';
import Inventory from './inventory.routes.js';
import Order from './order.routes.js';
import AddressBook from './addressBook.route.js';
import Bill from './billing.route.js';
import ActiveLog from './activeLog.route.js';
import StaffSalary from './staffSalary.route.js';
import Attendance from "./attendance.router.js";
import AttendanceDevice from "./attendanceDevice.router.js";
import PaymentGatway from "./PaymentGatway.route.js";

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});

// Apply rate limiting
router.use(apiLimiter);
router.use('/auth/login', authLimiter);
router.use('/auth/register', authLimiter);

// Define all API routes
router.use('/auth', authRouter);
router.use('/company', Company);
router.use('/plan', Plan);
router.use('/user', User);
router.use('/vendor', Vendor);
router.use('/inventory', Inventory);
router.use('/order', Order);
router.use('/address-book', AddressBook);
router.use('/billing', Bill);
router.use('/activity', ActiveLog);
router.use('/staff-salary', StaffSalary);
router.use("/attendance-device", AttendanceDevice);
router.use("/attendance", Attendance);
router.use("/strip", PaymentGatway);

export default router;
