import mysql from "mysql2/promise";
// Create MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",          // default MySQL user (change if yours is different)
  password: "Nilesh@123",// your MySQL password
  database: "Ngo_website", // create this DB in MySQL
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