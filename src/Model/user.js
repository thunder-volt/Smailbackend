const { sequelize } = require("../Config/db");
const { DataTypes } = require("sequelize");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(123),
  },
  refreshToken: {
    type: DataTypes.STRING(1234),
  },
  googleId: {
    type: DataTypes.STRING(1234),
  },
});

module.exports = { User };
