import dotenv from "dotenv";
import passport from "passport";
import IndexModel from "../models/indexModel.js";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await IndexModel.User.findOne({
        userId: jwt_payload.userId,
        deleted: false,
        verified: true,
        isActive: true,
      });
      // console.log("the users are in passport: ", user)
      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      // If superAdmin, skip all checks
      if (user.role === "superAdmin") {
        return done(null, user);
      }

      
      // Check if any plan is active for this module
      // For all other roles → check status
      if (user.status?.isaccepted === "pending") {
        return done(null, false, { message: "User approval is still pending" });
      }
      
      if (user.status?.isaccepted === "false") {
        return done(null, false, {
          message: `User was rejected by ${user.status?.performedBy}`,
        });
      }
      
      if (user.status?.isaccepted === "true") {
        return done(null, user);
      }
      
      // Catch-all fallback
      return done(null, false, { message: "Invalid user status" });
    } catch (error) {
      return done(error, false, { message: "Error during authentication" });
    }
  })
);

export default passport;
