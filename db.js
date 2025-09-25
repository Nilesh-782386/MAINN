import mysql from "mysql2/promise";

// Create MySQL connection pool with hardcoded values
const pool = mysql.createPool({
  host: "localhost",
  user: "root", 
  password: "Nilesh@123",
  database: "Ngo_website",
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

export { pool, connect, disconnect };