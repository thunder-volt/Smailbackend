const { google } = require("googleapis");
const { fetchAttach } = require("../Utils/fetchAttach.js");

module.exports.listLabels = async (auth) => {
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
  const promises = labels.map(async (label) => {
    let labelData = await gmail.users.labels.get({
      userId: "me",
      id: label.id,
    });
    return labelData.data;
  });
  let labelInfo = await Promise.all(promises);
  let labelsFetch = [...labelInfo];
  return labelsFetch;
};

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

module.exports.threadsData = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  let response;
  try {
    response = await gmail.users.threads.list({
      userId: "me",
      maxResults: 50,
    });
    let threadList = [...response.data.threads];
    let attach_ids = [];
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
          switch (threadData.data.messages[i].payload.headers[j].name) {
            case "From":
              from = threadData.data.messages[i].payload.headers[j].value;
              break;
            case "Date":
              date = threadData.data.messages[i].payload.headers[j].value;
              break;
            case "Subject":
              subject = threadData.data.messages[i].payload.headers[j].value;
              break;
            case "To":
              to = threadData.data.messages[i].payload.headers[j].value;
              break;
            case "Reply-To":
              reply_to = threadData.data.messages[i].payload.headers[j].value;
              break;
          }
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
      return mails;
      // return threadData.data.messages;
    });
    let threads = await Promise.all(thread_prom);
    threadFetch = [...threads];

    let attachments = await fetchAttach(auth, attach_ids);

    // console.log(response);
    // console.log(threadFetch);
    return { threads: threadFetch, attachments: attachments };
  } catch (err) {
    console.error(err);
    return null;
  }
};
