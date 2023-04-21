const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");
const { User } = require("../Model/user");
const fs = require("fs");
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://mail.google.com/",
  "profile",
];

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/auth/google/redirect",
      scope: SCOPES,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      const currentUser = await User.findOne({
        where: { googleId: profile.id },
      });
      if (currentUser) {
        console.log("current user is: ", currentUser);
        done(null, currentUser);
      } else {
        const client = await authenticate({
          scopes: SCOPES,
          keyfilePath: CREDENTIALS_PATH,
        });
        const refresh_token = client.credentials.refresh_token;
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          refreshToken: refresh_token,
        });
        console.log("created User: ", newUser);
        done(null, newUser);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findOne({ where: { id: id } });
  done(null, user);
});
