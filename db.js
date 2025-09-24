import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Create MySQL connection pool with environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "Ngo_website",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Method to connect to the database
const connect = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to the database");
    connection.release(); // release back to pool
  } catch (err) {
    console.error("Error connecting to the database:", err);
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

export { pool, connect, disconnect };