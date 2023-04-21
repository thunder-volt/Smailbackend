const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const {
  listLabels,
  threadsData,
} = require("../controllers/fetch_controllers.js");
const { addLabel, deleteLabel } = require("../controllers/label_controller.js");
const { postMail, batchModify } = require("../controllers/mail_controllers.js");

const authCheck = (req, res, next) => {
  if (!req.user) {
    res.status(401).send(req);
  } else {
    next();
  }
};

router.get("/", authCheck, async (req, res, next) => {
  res.send(req.user);
});

router.get("/labelsget", authCheck, async (req, res, next) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );
  oauth2Client.setCredentials({ refresh_token: req.user.refreshToken });
  const data = await listLabels(oauth2Client);
  res.send(data);
});

router.get("/threadslist", authCheck, async (req, res, next) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );
  oauth2Client.setCredentials({ refresh_token: req.user.refreshToken });
  const data = await threadsData(oauth2Client);
  res.send(data);
});

router.post("/addlabel", authCheck, async (req, res, next) => {
  let label = {
    name: req.body.name,
    color: {
      backgroundColor: req.body.backgroundColor,
      textColor: req.body.textColor,
    },
  };
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );
  oauth2Client.setCredentials({ refresh_token: req.user.refreshToken });
  const data = await addLabel(oauth2Client, label);
  res.send(data);
});

router.delete("/deletelabel", authCheck, async (req, res, next) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );
  oauth2Client.setCredentials({ refresh_token: req.user.refreshToken });
  const response = await deleteLabel(oauth2Client, req.body.id);
  res.send(response);
});

router.post("/dispatch", authCheck, async (req, res, next) => {
  const response = await postMail({
    user: req.body.user,
    to: req.body.to,
    from: req.body.from,
    subject: req.body.subject,
    text: req.body.text,
    html: req.body.html,
    refresh_token: req.user.refreshToken,
  });
  res.send(response);
});

router.post("/batchModify", authCheck, async (req, res, next) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );
  oauth2Client.setCredentials({ refresh_token: req.user.refreshToken });
  const response = await batchModify(oauth2Client, {
    ids: req.body.ids,
    add: req.body.add,
    remove: req.body.remove,
  });
  res.send(response);
});

module.exports = router;
