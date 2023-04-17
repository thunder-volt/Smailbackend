const { google } = require("googleapis");
const fs = require("fs");

module.exports.fetchAttach = async (auth, attach_ids) => {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const attach_promises = attach_ids.map(async (attachment) => {
      let attach_data = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: attachment.mId,
        id: attachment.aId,
      });
      // console.log(attach_data);
      //   let encoded = attach_data.data.data;
      //   encoded =
      //     typeof encoded === "string"
      //       ? encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "")
      //       : "";
      //   file = Buffer.from(encoded, "base64");
      //   fileName = `${attachment.mId}_${attachment.fileName}`;
      //   fs.writeFileSync(`./attachments/${fileName}`, file);

      return {
        messageId: attachment.mId,
        id: attachment.aId,
        fileName: attachment.fileName,
        size: attach_data.data.size,
        mimeType: attachment.mimeType,
        data: attach_data.data.data,
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
};
