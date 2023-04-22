const router = require("express").Router();
const passport = require("passport");
require("../Config/passport");
const fs = require("fs");
const file = fs.readFileSync("./7E0F905DFD18CD10D688D072EAEC3BAD.txt");
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

router.get("/.well-known/pki-validation/7E0F905DFD18CD10D688D072EAEC3BAD.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "7E0F905DFD18CD10D688D072EAEC3BAD"));
})

// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  // res.send(req.user);
  res.redirect("/profile");
});

module.exports = router;
