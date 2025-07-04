const app = require("./app");
const { connectDB } = require("./config/db");
const { initializeCollection } = require('./utils/qdrantClient');

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  Promise.all([
    connectDB(),
    initializeCollection()
  ]).then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  }).catch(error => {
    console.error('Initialization error:', error);
    process.exit(1);
  });
}

