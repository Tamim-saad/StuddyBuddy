

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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

