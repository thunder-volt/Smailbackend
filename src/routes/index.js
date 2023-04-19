const express = require("express");
const router = express.Router();
const cors = require("cors");
const { authorize } = require("../controllers/auth_controller.js");
const {
  listLabels,
  threadsData,
} = require("../controllers/fetch_controllers.js");
const { addLabel, deleteLabel } = require("../controllers/label_controller.js");
const app = express();

var corsOptions = {
  origin: [
    { origin: "http://localhost:3000", credentials: true },
    "http://localhost:8000",
  ],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(router);
app.use(express.urlencoded({ extended: true }));

router.get("/labelsget", async (req, res, next) => {
  const auth = await authorize();
  const data = await listLabels(auth);
  res.send(data);
});

router.get("/threadslist", async (req, res, next) => {
  const auth = await authorize();
  const data = await threadsData(auth);
  res.send(data);
});

router.post("/addlabel", async (req, res, next) => {
  let label = {
    name: req.body.name,
    color: {
      backgroundColor: req.body.backgroundColor,
      textColor: req.body.textColor,
    },
  };
  const auth = await authorize();
  const data = await addLabel(auth, label);
  res.send(data);
});

router.delete("/deletelabel", async (req, res, next) => {
  const auth = await authorize();
  const response = await deleteLabel(auth, req.body.id);
  res.send(response);
});

module.exports = app;
