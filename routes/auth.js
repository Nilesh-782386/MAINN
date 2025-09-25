import express from "express";
import { query } from "../db.js";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Multer setup for NGO registration (file upload)
const uploadDir = path.resolve("upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
function fileFilter(req, file, cb) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed!"), false);
  }
}
const upload = multer({ storage, fileFilter });
const saltRounds = 10;

// User login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        req.session.user = user;
        return res.json({ status: "success", redirect: "/" });
      } else {
        return res
          .status(401)
          .json({ status: "error", message: "Incorrect password" });
      }
    } else {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// NGO login
router.post("/ngo-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const sqlQuery = "SELECT * FROM ngo_register WHERE email = $1";
    const result = await query(sqlQuery, [email]);
    if (result.rows.length > 0) {
      const ngo = result.rows[0];
      if (ngo.registration_number === password) {
        req.session.user = ngo; // Use user session for consistency
        return res.redirect("/"); // Redirect instead of render
      } else {
        return res.status(401).json({ message: "Incorrect password" });
      }
    } else {
      return res.status(404).json({ message: "NGO not found" });
    }
  } catch (err) {
    console.error("Error logging in:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ VOLUNTEER LOGIN (ADDED)
router.post("/volunteer-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM volunteers WHERE email = ? AND status = 'active'", [email]);
    
    if (rows.length > 0) {
      const volunteer = rows[0];
      const valid = await bcrypt.compare(password, volunteer.password);
      
      if (valid) {
        req.session.volunteer = volunteer;
        return res.redirect("/volunteer-dashboard");
      } else {
        return res.status(401).json({ status: "error", message: "Incorrect password" });
      }
    } else {
      return res.status(404).json({ status: "error", message: "Volunteer not found" });
    }
  } catch (err) {
    console.error("Error in volunteer login:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// User registration - FIXED (NO DATE FIELD)
router.post("/register-user", async (req, res) => {
  const { Fullname, phone, email, password } = req.body;
  try {
    const [checkRows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (checkRows.length > 0) {
      return res.redirect("/user-login");
    } else {
      const hash = await bcrypt.hash(password, saltRounds);
      // FIX: Removed date field
      await pool.query(
        "INSERT INTO users (fullname, phone, email, password) VALUES (?, ?, ?, ?)",
        [Fullname, phone, email, hash]
      );
      return res.redirect("/user-login");
    }
  } catch (err) {
    console.error("Error saving user to database:", err);
    res.status(500).send("Internal Server Error");
  }
});

// NGO registration
router.post("/ngo-register", upload.single("file"), async (req, res) => {
  const {
    name,
    registration_number,
    email,
    phone,
    phone2,
    addline,
    land,
    city,
    state,
    pincode,
    optnote,
    url,
    socialsurl,
    terms,
  } = req.body;
  const registration_certificate = req.file;
  if (!registration_certificate) {
    return res.status(400).send("File upload failed or invalid file type");
  }
  try {
    const [checkRows] = await pool.query(
      "SELECT id FROM ngo_register WHERE registration_number = ?",
      [registration_number]
    );
    if (checkRows.length > 0) {
      return res.render("login_register/ngo-register", {
        user: req.session.user,
        error: "Registration number already exists. Please use a unique registration number.",
      });
    }
    const query = `
      INSERT INTO ngo_register (
        ngo_name,
        registration_number,
        email,
        primary_phone,
        alternate_phone,
        address,
        landmark,
        city,
        state,
        pincode,
        description,
        website_url,
        social_handle_url,
        registration_certificate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      name,
      registration_number,
      email,
      phone,
      phone2,
      addline,
      land,
      city,
      state,
      pincode,
      optnote,
      url,
      socialsurl,
      registration_certificate.path,
    ]);
    return res.redirect("/ngo-login");
  } catch (err) {
    console.error("Error saving NGO to database:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ VOLUNTEER REGISTRATION (ADDED)
router.post("/volunteer-register", async (req, res) => {
  const { name, email, phone, password, city, vehicle_type } = req.body;
  
  try {
    // Check if volunteer already exists
    const [checkRows] = await pool.query(
      "SELECT * FROM volunteers WHERE email = ?", 
      [email]
    );
    
    if (checkRows.length > 0) {
      return res.redirect("/volunteer-register?error=exists");
    }

    // Hash password and create volunteer
    const hash = await bcrypt.hash(password, saltRounds);
    await pool.query(
      `INSERT INTO volunteers (name, email, phone, password, city, vehicle_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, hash, city, vehicle_type]
    );

    res.redirect("/volunteer-login?success=registered");
  } catch (err) {
    console.error("Error in volunteer registration:", err);
    res.redirect("/volunteer-register?error=server");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ✅ VOLUNTEER LOGOUT (ADDED)
router.get("/volunteer-logout", (req, res) => {
  req.session.volunteer = null;
  res.redirect("/");
});

export default router;