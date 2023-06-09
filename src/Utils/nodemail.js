const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const fs = require("fs");
var path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "vars/.env"),
});

const creds = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
};

const oauthClient = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

module.exports.sendMail = async ({
  user,
  to,
  from,
  subject,
  text,
  html,
  refresh_token,
}) => {
  try {
    oauthClient.setCredentials({ refresh_token: refresh_token });
    const accessToken = await oauthClient.getAccessToken();
    // console.log(accessToken);
    const transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        type: "OAuth2",
        user: user ? user : "ch21b108@smail.iitm.ac.in",
        clientId: creds.client_id,
        clientSecret: creds.client_secret,
        refreshToken: refresh_token,
        accessToken: accessToken.token,
        expires: 1484314697598,
      },
    });

    const mailOptions = {
      to: to ? to : "ch21b062@smail.iitm.ac.in",
      from: from ? from : "ch21b108@smail.iitm.ac.in",
      subject: subject ? subject : "hello",
      text: text ? text : "test",
      html: html ? html : "<h1>hello</h1>",
      attachments: false,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (e) {
    return e;
  }
};
