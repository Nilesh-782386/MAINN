import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Create PostgreSQL connection pool using Replit's built-in database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 10000,
});

// Method to connect to the database
const connect = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database");
    client.release(); // release back to pool
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err; // Important: re-throw the error
  }
};

// Method to disconnect from the database
const disconnect = async () => {
  try {
    await pool.end();
    console.log("Disconnected from the database");
  } catch (err) {
    console.error("Error disconnecting from the database:", err);
  }
};

// Helper method to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export { pool, connect, disconnect, query };