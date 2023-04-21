const express = require("express");
const path = require("path");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: "../vars/.env" });

const cookieSession = require("cookie-session");
const { User } = require("./Model/user");
const { testDbConnection } = require("./Config/db");
const passport = require("passport");
const cors = require("cors");

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.KEYS],
  })
);

app.use(passport.initialize());
app.use(passport.session());

// app.use(cors(corsOptions));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", require("./routes/auth"));
app.use("/profile", require("./routes/profile"));

const port = process.env.PORT || 8080;
(async () => {
  await testDbConnection();
  await User.sync({ alter: true });
  app.listen(port, () => console.log(`Listening to ${port}...`));
})();
