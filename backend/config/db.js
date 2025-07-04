

const { Pool } = require("pg");

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database:  'StuddyBuddy',
  password: 'Reset321',
  port: 5432,
});

const connectDB = async () => {
  try {
    // Test the connection by querying the version
    const res = await pool.query("SELECT version()");
    console.log("PostgreSQL Connected:", res.rows[0].version);
  } catch (error) {
    console.error("PostgreSQL connection error:", error.message);
  }
};

module.exports = {
  connectDB,
  pool,
};

