import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Volunteer registration (support both URLs)
router.post(["/volunteer-register", "/volunteer/register"], async (req, res) => {
  const { name, email, phone, password, city, vehicle_type } = req.body;
  
  try {
    const [checkRows] = await pool.query(
      "SELECT * FROM volunteers WHERE email = ?", 
      [email]
    );
    
    if (checkRows.length > 0) {
      return res.redirect("/volunteer-register?error=exists");
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO volunteers (name, email, phone, password, city, vehicle_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, hash, city, vehicle_type]
    );

    res.redirect("/volunteer-login?success=registered");
  } catch (err) {
    console.error("Registration error:", err);
    res.redirect("/volunteer-register?error=server");
  }
});

// Volunteer login (support both URLs)
router.post(["/volunteer-login", "/volunteer/login"], async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM volunteers WHERE email = ? AND status = 'active'", 
      [email]
    );
    
    if (rows.length > 0) {
      const volunteer = rows[0];
      const valid = await bcrypt.compare(password, volunteer.password);
      
      if (valid) {
        req.session.volunteer = volunteer;
        return res.redirect("/volunteer-dashboard");
      }
    }
    
    res.redirect("/volunteer-login?error=invalid");
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/volunteer-login?error=server");
  }
});

// Volunteer logout
router.get("/volunteer-logout", (req, res) => {
  req.session.volunteer = null;
  res.redirect("/");
});

export default router;