const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleProfile = {
          google_id: profile.id,
          email: profile.emails[0].value,
          full_name: profile.displayName,
          avatar_url: profile.photos?.[0]?.value || null,
          email_verified: true,
        };
        return done(null, googleProfile);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;