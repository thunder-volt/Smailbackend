const express = require("express");
const app = express();
const fs = require("fs");
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

// variables
var mailsFetch = [];
var labelsFetch = [];
var threadFetch = [];
var threadList = [];
let attach_ids = [];
var attachments = [];

function getHTMLPart(arr) {
  for (var x = 0; x <= arr.length; x++) {
    if (typeof arr[x].parts === "undefined") {
      if (arr[x].mimeType === "text/html") {
        return arr[x].body.data;
      }
    } else {
      return getHTMLPart(arr[x].parts);
    }
  }
  return "";
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
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

async function fetchAttach(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const attach_promises = attach_ids.map(async (attachment) => {
      let attach_data = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: attachment.mId,
        id: attachment.aId,
      });
      // console.log(attach_data);
      let encoded = attach_data.data.data;
      encoded =
        typeof encoded === "string"
          ? encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "")
          : "";
      file = Buffer.from(encoded, "base64");
      fs.writeFileSync(`./attachments/${attachment.fileName}`, file);

      return {
        messageId: attachment.mId,
        id: attachment.aId,
        fileName: attachment.fileName,
        size: attach_data.data.size,
        mimeType: attachment.mimeType,
        // data: attach_data.data.data,
      };
    });

    const data = await Promise.all(attach_promises);
    // console.log(data);
    attachments = [...data];
    return attachments;
  } catch (e) {
    console.error(e);
    return null;
  }
}

const threadsData = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  let response;
  try {
    response = await gmail.users.threads.list({
      userId: "me",
      maxResults: 50,
    });
    threadList = [...response.data.threads];
    const thread_prom = threadList.map(async (mail) => {
      let threadData = await gmail.users.threads.get({
        userId: "me",
        id: mail.id,
      });
      // console.log(threadData);
      let from = "";
      let to = "";
      let reply_to = "";
      let body = "";
      let date = "";
      let subject = "";
      let labelsList = [];
      let snippet = "";
      let threadId = "";
      let mails = [];
      let internalDate = "";

      for (let i = 0; i < threadData.data.messages.length; i++) {
        // console.log(threadData.data.messages[i].payload.headers.length);
        // attach_ids = [];
        labelsList = [...threadData.data.messages[i].labelIds];
        snippet = threadData.data.messages[i].snippet;
        threadId = threadData.data.messages[i].threadId;
        internalDate = new Date(
          parseInt(threadData.data.messages[i].internalDate, 10)
        );
        // console.log(internalDate);
        for (
          let j = 0;
          j < threadData.data.messages[i].payload.headers.length;
          j++
        ) {
          if (threadData.data.messages[i].payload.headers[j].name === "From") {
            from = threadData.data.messages[i].payload.headers[j].value;
          }
          if (threadData.data.messages[i].payload.headers[j].name === "Date") {
            date = threadData.data.messages[i].payload.headers[j].value;
          }
          if (
            threadData.data.messages[i].payload.headers[j].name === "Subject"
          ) {
            subject = threadData.data.messages[i].payload.headers[j].value;
          }
          if (threadData.data.messages[i].payload.headers[j].name === "To") {
            to = threadData.data.messages[i].payload.headers[j].value;
          }
          if (
            threadData.data.messages[i].payload.headers[j].name === "Reply-To"
          ) {
            reply_to = threadData.data.messages[i].payload.headers[j].value;
          }
          if (
            threadData.data.messages[i].payload.headers[j].name === "Subject"
          ) {
            subject = threadData.data.messages[i].payload.headers[j].value;
          }
          // console.log(
          //   typeof threadData.data.messages[i].payload.parts[0].body.data
          // );
          // let encodedBody = threadData.data.messages[i].payload.parts
          //   ? threadData.data.messages[i].payload?.parts[1].body.data
          //   : "";
        }
        let encodedBody = "";
        if (typeof threadData.data.messages[i].payload.parts === "undefined") {
          encodedBody = threadData.data.messages[i].payload.body;
        } else {
          encodedBody = getHTMLPart(threadData.data.messages[i].payload.parts);
          for (
            let j = 0;
            j < threadData.data.messages[i].payload.parts.length;
            j++
          ) {
            if (
              threadData.data.messages[i].payload.parts[j].body.attachmentId
            ) {
              attach_ids.push({
                mId: threadData.data.messages[i].id,
                aId: threadData.data.messages[i].payload.parts[j].body
                  .attachmentId,
                fileName: threadData.data.messages[i].payload.parts[j].filename,
                mimeType: threadData.data.messages[i].payload.parts[j].mimeType,
              });
            }
          }
          // console.log(encodedBody);
        }
        encodedBody =
          typeof encodedBody === "string"
            ? encodedBody
                .replace(/-/g, "+")
                .replace(/_/g, "/")
                .replace(/\s/g, "")
            : "";
        body = Buffer.from(encodedBody, "base64").toString();
        let object = {
          id: threadData.data.messages[i].id,
          from: from,
          to: to,
          reply_to: reply_to,
          date: date,
          internalDate: internalDate,
          subject: subject ? subject : "no subject",
          labelsList: labelsList,
          snippet: snippet,
          threadId: threadId,
          body: body ? body : "no body",
        };
        mails.push(object);
      }
      // return mails;
      return threadData.data.messages;
    });
    threads = await Promise.all(thread_prom);
    threadFetch = [...threads];

    // console.log(response);
    // console.log(threadFetch);
    return threadFetch;
  } catch (err) {
    console.error(err);
    return null;
  }
};

authorize()
  .then(async (res) => {
    let labs = await listLabels(res);
    let threads = await threadsData(res);
    let attach = await fetchAttach(res);
    return [labs, threads, attach];
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

app.get("/threadslist", (req, res) => {
  res.send(threadFetch);
});

app.get("/attachments", (req, res) => {
  res.send(attachments);
});

app.listen(8000, () => {
  console.log("Server Started");
});
