const express = require("express");
const app = express();
const fs = require("fs").promises;
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const cors = require("cors");
var corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:8000"],
};
app.use(cors(corsOptions));
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function listLabels(auth) {
  let _labels;
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.list({
    userId: "me",
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log("No labels found.");
    return;
  }
  console.log("Labels:");
  _labels = labels.map((label) => {
    return label.name;
  });
  labelsFetch = [..._labels];
}

const gamilData = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  let response;
  let messages;
  try {
    response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 50,
    });
    console.log(response.data.messages[0].id);
    const promises = response.data.messages.map(async (mail) => {
      let _data = await gmail.users.messages.get({
        userId: "me",
        id: mail.id,
      });
      //   console.log(_data);
      return _data.data.snippet;
    });
    messages = await Promise.all(promises);
    console.log(messages);
    mailsFetch = { ...messages };
    return messages;
  } catch (err) {
    // document.getElementById('content').innerText = err.message;
    // console.log(err);
    return null;
  }
  // const labels = messages;
  // if (!labels || labels.length == 0) {
  //     document.getElementById('content').innerText = 'No labels found.';
  //     return;
  // }
  // Flatten to string to display
  // const output = labels.reduce(
  //     (str, label) => `${str}${label}\n`,
  //     'Labels:\n');
  // document.getElementById('content').innerText = labels;
};
var mailsFetch = [];
var labelsFetch = [];
// app.post("/mails", async (req, res) => {
//   // let data = [];
//   try {
//     let result = await authorize();
//     mailsFetch = await gamilData(result);
//     console.log(mailsFetch.length);
//     res.send(mailsFetch);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send(error);
//   }
// });

authorize()
  .then(async (res) => {
    let mails = await gamilData(res);
    let labs = await listLabels(res);
    return [mails, labs];
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/mailsget", (req, res) => {
  res.send(mailsFetch);
});

app.get("/labelsget", (req, res) => {
  res.send(labelsFetch);
});

app.listen(8000, () => {
  console.log("Server Started");
});
