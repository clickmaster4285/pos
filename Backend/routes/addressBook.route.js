import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();


// router.post('/register', Indexcontroller.authController.register);
router.post('/create-shippment-address', passport.authenticate("jwt", { session: false }), authenticateToken, Indexcontroller.AddressBook.createAddress);
router.get('/get-all-shippment-address', passport.authenticate("jwt", { session: false }), authenticateToken, Indexcontroller.AddressBook.getAllAddresses);
router.get('/get-shippment-address-byid/:id', passport.authenticate("jwt", { session: false }), authenticateToken, Indexcontroller.AddressBook.getAddressById);
router.patch('/update-shippment-address-byid/:id', passport.authenticate("jwt", { session: false }), authenticateToken, Indexcontroller.AddressBook.updateAddress);
router.delete('/delete-shippment-address-byid/:id', passport.authenticate("jwt", { session: false }), authenticateToken, Indexcontroller.AddressBook.deleteAddress);

export default router;
