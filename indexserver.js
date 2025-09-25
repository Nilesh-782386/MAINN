import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connect, disconnect, pool } from "./db.js";
import session from "express-session";
import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import ngoRoutes from "./routes/ngo.js";
import generalRoutes from "./routes/general.js";
import volunteerRoutes from "./routes/volunteer.js";
import volunteerDashboardRoutes from "./routes/volunteer-dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 5000;

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "upload")));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "default-secret-key-for-development-12345",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 5 * 24 * 60 * 60 * 1000,
    },
    rolling: true,
  })
);

// Make session variables available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.ngo = req.session.ngo || null;
  res.locals.volunteer = req.session.volunteer || null;
  next();
});

// Use routes
app.use(authRoutes);
app.use(donationRoutes);
app.use(ngoRoutes);
app.use(generalRoutes);
app.use(volunteerRoutes);
app.use(volunteerDashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

async function ensureSchema() {
  try {
    if (!pool) {
      console.warn("No database pool available for schema check");
      return;
    }

    const columnExists = async (table, column) => {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows[0]?.cnt > 0;
    };

    const ensureColumn = async (table, column, definition) => {
      const exists = await columnExists(table, column);
      if (!exists) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added column ${column} to table ${table}`);
      }
    };

    await ensureColumn("donations", "title", "VARCHAR(255) NULL");
    await ensureColumn("donations", "description", "TEXT NULL");
    await ensureColumn("donations", "proof_image", "VARCHAR(512) NULL");
    await ensureColumn("donations", "volunteer_name", "VARCHAR(255) NULL");
    await ensureColumn("donations", "volunteer_phone", "VARCHAR(50) NULL");
    
    console.log("Schema check completed");
  } catch (e) {
    console.warn("Schema ensure skipped:", e.message);
  }
}

// Start server with better error handling
async function startServer() {
  try {
    console.log("Attempting to connect to database...");
    await connect();
    console.log("✅ Connected to the database");
    
    await ensureSchema();
    
    // Start the server on localhost only
    const server = app.listen(port, "localhost", () => {
      console.log(`✅ Server running on http://localhost:${port}`);
    });
    
    // Verify server is listening
    server.on('listening', () => {
      const address = server.address();
      console.log(`✅ Server successfully listening on port: ${address.port}`);
    });
    
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("🔄 Starting server without database connection...");
    
    // Start server even if database fails
    const server = app.listen(port, "localhost", () => {
      console.log(`⚠️  Server running without database on http://localhost:${port}`);
    });
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const gracefulShutdown = async () => {
  console.log("Gracefully shutting down...");
  await disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start the server
startServer();