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
  // console.log("Labels:");
  // console.log(labels);
  _labels = labels.map((label) => {
    return { id: label.id, name: label.name };
  });
  labelsFetch = [..._labels];
}

const gmailData = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  let response;
  let messages;
  try {
    response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 50,
    });
    // console.log(response.data.messages[0].id);
    const promises = response.data.messages.map(async (mail) => {
      let _data = await gmail.users.messages.get({
        userId: "me",
        id: mail.id,
      });
      // console.log(_data);
      return {
        id: mail.id,
        labels: [..._data.data.labelIds],
        snippet: _data.data.snippet,
        threadId: _data.data.threadId,
      };
    });
    messages = await Promise.all(promises);

    const thread_prom = messages.map(async (mail) => {
      let threadData = await gmail.users.threads.get({
        userId: "me",
        id: mail.threadId,
      });
      // console.log(threadData);
      let from;
      let date;
      let subject;
      for (
        let i = 0;
        i < threadData.data.messages[0].payload.headers.length;
        i++
      ) {
        if (threadData.data.messages[0].payload.headers[i].name === "From") {
          from = threadData.data.messages[0].payload.headers[i].value;
        }
        if (threadData.data.messages[0].payload.headers[i].name === "Date") {
          date = threadData.data.messages[0].payload.headers[i].value;
        }
        if (threadData.data.messages[0].payload.headers[i].name === "Subject") {
          subject = threadData.data.messages[0].payload.headers[i].value;
        }
      }
      // return {
      //   id: threadData.data.id,
      //   subject: subject,
      //   snippet: threadData.data.messages[0].snippet,
      //   from: from,
      //   date: date,
      // };
      return threadData;
    });

    threads = await Promise.all(thread_prom);
    threadFetch = [...threads];
    // console.log(messages);
    mailsFetch = [...messages];
    return messages;
  } catch (err) {
    return null;
  }
};
var mailsFetch = [];
var labelsFetch = [];
var threadFetch = [];

authorize()
  .then(async (res) => {
    let mails = await gmailData(res);
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

app.get("/threadsget", (req, res) => {
  res.send(threadFetch);
});

app.listen(8000, () => {
  console.log("Server Started");
});
