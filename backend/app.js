require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.disable("x-powered-by");

const corsOptions = {
  origin: [
    "http://localhost:3000",      // Development
    "http://localhost",           // Local production
    "http://135.235.137.78",      // Azure VM production
    process.env.FRONTEND_URL      // Environment variable
  ].filter(Boolean), // Remove any undefined values
  methods: ["GET", "POST", "PUT", "DELETE"],
  hideOptionsCall: true,
  optiosSuccessStatus: 200
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Route imports
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// Mount routes

app.use("/api/user", userRoutes);
app.use("/api/uploads", uploadRoutes);

app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Welcome to our app" });
});

module.exports = app;
