import express from "express";
import { pool } from "../db.js";
import { ensureUserAuthenticated } from "../middleware/auth.js";
import { ensureNGOAuthenticated } from "../middleware/auth.js";
import { ensureVolunteerAuthenticated } from "../middleware/auth.js"; // ✅ ADDED

const router = express.Router();

// Safe session data function - ✅ UPDATED TO INCLUDE VOLUNTEER
const getSafeSession = (req) => ({
  user: req.session.user || null,
  ngo: req.session.ngo || null,
  volunteer: req.session.volunteer || null // ✅ ADDED
});

router.get("/", (req, res) => {
  res.render("index", getSafeSession(req));
});

router.get("/rewards", ensureUserAuthenticated, (req, res) => {
  res.render("rewards", getSafeSession(req));
});

router.get("/ngo-login", (req, res) => {
  res.render("login_register/ngo_login", getSafeSession(req));
});

router.get("/user-login", (req, res) => {
  res.render("login_register/user_login", getSafeSession(req));
});

// ✅ VOLUNTEER LOGIN PAGE (ADDED)
router.get("/volunteer-login", (req, res) => {
  res.render("login_register/volunteer_login", getSafeSession(req));
});

router.get("/register-user", (req, res) => {
  res.render("login_register/user-register", getSafeSession(req));
});

// ✅ VOLUNTEER REGISTER PAGE (ADDED)
router.get("/volunteer-register", (req, res) => {
  res.render("login_register/volunteer_register", getSafeSession(req));
});

router.get("/ngo-user", (req, res) => {
  res.render("login_register/user-register", getSafeSession(req));
});

router.get("/complete-registration", (req, res) => {
  res.render("index", getSafeSession(req));
});

router.get("/ngo-register", (req, res) => {
  res.render("login_register/ngo-register", getSafeSession(req));
});

router.get("/donate2", ensureUserAuthenticated, (req, res) => {
  res.render("donate/donate2", getSafeSession(req));
});

router.get("/contact", (req, res) => {
  res.render("contact", getSafeSession(req));
});

router.get("/about", (req, res) => {
  res.render("about", getSafeSession(req));
});

router.get("/user", ensureUserAuthenticated, (req, res) => {
  res.render("account", getSafeSession(req));
});

router.get("/donate", ensureUserAuthenticated, (req, res) => {
  res.render("donate/donate1", getSafeSession(req));
});

router.get("/login", (req, res) => {
  res.render("login_register/user_login", getSafeSession(req));
});

router.get("/submit-info", ensureUserAuthenticated, (req, res) => {
  const { donationId } = req.query;
  res.render("donate/donate2", { 
    donationId,
    ...getSafeSession(req)
  });
});

router.get("/donated", ensureUserAuthenticated, (req, res) => {
  const { donationId } = req.query;
  res.render("donate/donate3", { 
    donationId,
    ...getSafeSession(req)
  });
});

// ✅ VOLUNTEER DASHBOARD (ADDED)
router.get("/volunteer-dashboard", ensureVolunteerAuthenticated, (req, res) => {
  res.render("volunteer/dashboard", getSafeSession(req));
});

router.post("/query", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await pool.query(
      "INSERT INTO queries (name, email, query) VALUES (?, ?, ?)",
      [name, email, message]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error saving contact query:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/ngo-dashboard", ensureNGOAuthenticated, (req, res) => {
  res.render("admin/VerifyNGOs", getSafeSession(req));
});

export default router;