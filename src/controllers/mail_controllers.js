const { sendMail } = require("../Utils/nodemail");

module.exports.postMail = async (mailObject) => {
  const response = await sendMail(mailObject);
  return response;
};
