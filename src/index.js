const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use("/", require("./routes"));

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
