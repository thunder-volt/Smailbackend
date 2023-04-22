const router = require("express").Router();
const passport = require("passport");
require("../Config/passport");
const fs = require("fs");
const file = fs.readFileSync("./E62A6FD9BC1C4B443D7DFF0410E29CC9.txt");
const path = require("path");
// auth login
router.get("/login", (req, res) => {
  res.send(req.user);
});

// auth logout
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("https://shaastra.org");
  // res.redirect("/profile");
});

// auth with google+
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
      "https://mail.google.com/",
      "profile",
    ],
  })
);

router.get("/.well-known/pki-validation/E62A6FD9BC1C4B443D7DFF0410E29CC9.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "E62A6FD9BC1C4B443D7DFF0410E29CC9.txt"));
})

// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  // res.send(req.user);
  res.redirect("/profile");
});

module.exports = router;
