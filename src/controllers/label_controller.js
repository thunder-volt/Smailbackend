const { google } = require("googleapis");

module.exports.addLabel = async (auth, label) => {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: label.name,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
      color: {
        backgroundColor: label.color.backgroundColor,
        textColor: label.color.textColor,
      },
      messagesTotal: 0,
      messagesUnread: 0,
      threadsTotal: 0,
      threadsUnread: 0,
      type: "system",
    },
  });
  return res;
};

module.exports.deleteLabel = async (auth, id) => {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.delete({
    userId: "me",
    id: id,
  });
  return res;
};
