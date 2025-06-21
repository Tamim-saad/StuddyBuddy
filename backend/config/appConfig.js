require("dotenv").config();
const appConfig = {
  PORT: process.env.PORT || 5000,
  DB: {
    POSTGRES_URI: process.env.POSTGRES_URI 
  },
  AUTH: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
};
module.exports = appConfig;
