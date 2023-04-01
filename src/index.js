const express = require("express");
const app = express();
const fs = require("fs").promises;
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

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

// async function listLabels(auth) {
//     const gmail = google.gmail({ version: "v1", auth });
//     const res = await gmail.users.labels.list({
//         userId: "me",
//     });
//     const labels = res.data.labels;
//     if (!labels || labels.length === 0) {
//         console.log("No labels found.");
//         return;
//     }
//     console.log("Labels:");
//     labels.forEach((label) => {
//         console.log(`- ${label.name}`);
//     });
// }

const gamilData = async (auth) => {
    const gmail = google.gmail({ version: "v1", auth });
    let response;
    let messages;
    try {
        response = await gmail.users.messages.list({
            userId: 'me',
            labelIds: ['INBOX'],
            maxResults: 10,
        });
        console.log(response);
        const promises = response.result.messages.map(async (mail) => {
            let data = await gmail.users.messages.get({
                userId: 'me',
                id: mail.id,
            });
            return data.result.snippet;
        })
        messages = await Promise.all(promises);
        console.log(messages);
        return messages;

    } catch (err) {
        // document.getElementById('content').innerText = err.message;
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
}

app.get("/mails", (req, resp) => {
    let data = [];
    authorize().then((res) => {
        data = gamilData(res);
    })
    resp.send(data);
})

app.listen(8000, () => {
    console.log("Server Started")
})