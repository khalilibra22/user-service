import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserService } from "../services/user.service";
import { getLogger } from "../utils/logger";

const userService = new UserService();
const logger = getLogger();
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "1087619747666-8udka2t24crenrlbd9ri8lci9hdkcgqj.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userBody = {
          googleId: profile.id,
          email: profile.emails?.[0].value,
          fullname: profile.displayName,
          profilePicture: profile.photos?.[0].value,
          role: 2,
        };
        const user = await userService.getUserByGoogleId(profile.id);
        if (user) {
          return done(null, user);
        }
        const createdUser = await userService.createUser(userBody);

        return done(null, createdUser);
      } catch (error: any) {
        logger.error("Error in Google Strategy:", error);
        return done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});
