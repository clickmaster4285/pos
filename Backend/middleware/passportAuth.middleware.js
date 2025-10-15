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
      return done(null, user);
      } catch (error) {
      return done(error, false, { message: "Error during authentication" });
    }
  })
);

export default passport;
