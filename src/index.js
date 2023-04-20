const express = require("express");
const path = require("path");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: "../vars/.env" });
app.use("/", require("./routes"));

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
