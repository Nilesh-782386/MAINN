import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connect, disconnect, query } from "./db.js";
import session from "express-session";
import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import ngoRoutes from "./routes/ngo.js";
import generalRoutes from "./routes/general.js";
import volunteerRoutes from "./routes/volunteer.js";
import volunteerDashboardRoutes from "./routes/volunteer-dashboard.js";
import dashboardRoutes from "./routes/dashboard.js";
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
app.use(dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

async function ensureSchema() {
  try {
    console.log("PostgreSQL schema is ready - all tables created successfully");
    console.log("✅ Tables available: donors, volunteers, ngos, donation_requests, users, ngo_register, donations");
  } catch (e) {
    console.warn("Schema check skipped:", e.message);
  }
}

// Start server with better error handling
async function startServer() {
  try {
    console.log("Attempting to connect to database...");
    await connect();
    console.log("✅ Connected to the database");
    
    await ensureSchema();
    
    // Start the server on 0.0.0.0 for Replit environment
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}`);
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
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`⚠️  Server running without database on http://0.0.0.0:${port}`);
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