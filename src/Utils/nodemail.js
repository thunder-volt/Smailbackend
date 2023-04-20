const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const fs = require("fs");
var path = require("path");
require("dotenv").config();

const data = fs.readFileSync(
  path.join(__dirname, "..", "controllers/token.json")
);
const creds = JSON.parse(data);

const oauthClient = new google.auth.OAuth2(
  creds.client_id,
  creds.client_secret,
  process.env.REDIRECT_URL
);
oauthClient.setCredentials({ refresh_token: creds.refresh_token });

async function sendMail() {
  try {
    const accessToken = await oauthClient.getAccessToken();
    // console.log(accessToken);
    const transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        type: "OAuth2",
        user: "ch21b108@smail.iitm.ac.in",
        clientId: creds.client_id,
        clientSecret: creds.client_secret,
        refreshToken: creds.refresh_token,
        accessToken: accessToken.token,
        expires: 1484314697598,
      },
    });

    const mailOptions = {
      to: "ch21b062@smail.iitm.ac.in",
      from: "ch21b108@smail.iitm.ac.in",
      subject: "hello",
      text: "test",
      html: "<h1>hello</h1>",
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (e) {
    return e;
  }
}

sendMail()
  .then((res) => console.log(res))
  .catch((e) => console.error(e));
