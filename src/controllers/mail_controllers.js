const { google } = require("googleapis");
const { sendMail } = require("../Utils/nodemail");

module.exports.postMail = async (mailObject) => {
  const response = await sendMail(mailObject);
  return response;
};

module.exports.batchModify = async (auth, info) => {
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.messages.batchModify({
    userId: "me",
    requestBody: {
      ids: [...info.ids],
      addLabelIds: [...info.add],
      removeLabelIds: [...info.remove],
    },
  });
  return response;
};
