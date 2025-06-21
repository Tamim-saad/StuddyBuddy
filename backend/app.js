require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.disable("x-powered-by");

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  hideOptionsCall: true,
  optiosSuccessStatus: 200
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Route imports
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
// Mount routes

app.use("/api/user", userRoutes);

app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Welcome to our app" });
});

module.exports = app;
