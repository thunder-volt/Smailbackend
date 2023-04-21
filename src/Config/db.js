const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "vars/.env"),
});

const sequelize = new Sequelize(process.env.DATABASE);

const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sequelize, testDbConnection };
