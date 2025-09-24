import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connect, disconnect, pool } from "./db.js";
import session from "express-session";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import ngoRoutes from "./routes/ngo.js";
import generalRoutes from "./routes/general.js";
import volunteerRoutes from "./routes/volunteer.js"; // ✅ ADDED
import volunteerDashboardRoutes from "./routes/volunteer-dashboard.js"; // ✅ ADDED
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

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
    secret: process.env.SECRET_KEY || "default-secret-key-for-development-12345",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 5 * 24 * 60 * 60 * 1000,
    },
    rolling: true,
  })
);

// ✅ UPDATED: Make session variables available to all templates (ADDED VOLUNTEER)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.ngo = req.session.ngo || null;
  res.locals.volunteer = req.session.volunteer || null; // ✅ ADDED THIS LINE
  next();
});

// Use routes
app.use(authRoutes);
app.use(donationRoutes);
app.use(ngoRoutes);
app.use(generalRoutes);
app.use(volunteerRoutes); // ✅ ADDED
app.use(volunteerDashboardRoutes); // ✅ ADDED

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

async function ensureSchema() {
  try {
    await pool.query(`
      ALTER TABLE donations
        ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS description TEXT NULL,
        ADD COLUMN IF NOT EXISTS proof_image VARCHAR(512) NULL,
        ADD COLUMN IF NOT EXISTS volunteer_name VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS volunteer_phone VARCHAR(50) NULL;
    `);
  } catch (e) {
    console.warn("Schema ensure skipped:", e.message);
  }
}

app.listen(port, "0.0.0.0", async () => {
  try {
    await connect();
    await ensureSchema();
    console.log(`Server running on http://0.0.0.0:${port}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    console.log("Server starting without database connection...");
    console.log(`Server running on http://0.0.0.0:${port}`);
  }
});

const gracefulShutdown = async () => {
  console.log("Gracefully shutting down...");
  await disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);