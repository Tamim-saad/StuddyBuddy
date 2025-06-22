
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  connectDB(); // connectDB is async, you can await it or handle promise here
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
  
}

