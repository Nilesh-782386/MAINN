import express from "express";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import { ensureNGOAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// NGO: Create donation request
router.get("/ngo/dashboard", ensureNGOAuthenticated, async (req, res) => {
  try {
    const ngoCity = req.session.ngo?.city || '';
    const [open] = await pool.query(
      "SELECT * FROM donations WHERE status = 'pending' ORDER BY created_at DESC"
    );
    const [assigned] = await pool.query(
      "SELECT * FROM donations WHERE status = 'assigned' ORDER BY assigned_at DESC"
    );
    const [delivered] = await pool.query(
      "SELECT * FROM donations WHERE status = 'delivered' ORDER BY updated_at DESC"
    );
    res.render("ngo/dashboard", { open, assigned, delivered, ngo: req.session.ngo });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

router.post("/ngo/requests", ensureNGOAuthenticated, async (req, res) => {
  const { title, description, city } = req.body;
  try {
    await pool.query(
      "INSERT INTO donations (title, description, city, status, created_at) VALUES (?, ?, ?, 'pending', NOW())",
      [title, description, city]
    );
    res.redirect("/ngo/dashboard");
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

// Admin: List and verify NGOs with filters/search

router.get("admin/all-donations", ensureNGOAuthenticated, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { status, city, search } = req.query;
  let whereClauses = [];
  let values = [];
  let idx = 0;
  if (status && status !== "") {
    whereClauses.push(`status = ?`);
    values.push(status);
  }
  if (city && city !== "") {
    whereClauses.push(`LOWER(city) = LOWER(?)`);
    values.push(city);
  }
  if (search && search !== "") {
    whereClauses.push(`(
      LOWER(fname) LIKE LOWER(?) OR
      LOWER(lname) LIKE LOWER(?) OR
      LOWER(city) LIKE LOWER(?) OR
      LOWER(addline) LIKE LOWER(?)
    )`);
    values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  let whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  try {
    const query = `SELECT id, books, clothes, grains, footwear, toys, schoolsupplies, fname, lname, email, phone, phone2, flat, addline, land, city, state, pincode, optnote, pickup_date, pickup_time, status FROM donations ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(query, [...values, limit, offset]);
    
    const countQuery = `SELECT COUNT(*) as count FROM donations ${whereSQL}`;
    const [countRows] = await pool.query(countQuery, values);
    const total = parseInt(countRows[0].count);
    
    const totalPages = Math.ceil(total / limit);
    
    const [totalRequestsRows] = await pool.query("SELECT COUNT(*) as count FROM donations");
    const [completedRows] = await pool.query("SELECT COUNT(*) as count FROM donations WHERE status = 'completed'");
    const [activeRows] = await pool.query("SELECT COUNT(*) as count FROM donations WHERE status = 'pending'");
    
    res.render("admin/AllDonations", {
      donations: rows,
      currentPage: page,
      totalPages,
      user: req.session.user,
      ngo: req.session.ngo,
      totalRequests: parseInt(totalRequestsRows[0].count),
      completedCount: parseInt(completedRows[0].count),
      activeCount: parseInt(activeRows[0].count),
      filterStatus: status || "",
      filterCity: city || "",
      filterSearch: search || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/admin/ngos", ensureNGOAuthenticated, async (req, res) => {
  const { status, city, search } = req.query;
  let whereClauses = [];
  let values = [];
  if (status && status !== "") {
    whereClauses.push(`status = ?`);
    values.push(status);
  }
  if (city && city !== "") {
    whereClauses.push(`LOWER(city) = LOWER(?)`);
    values.push(city);
  }
  if (search && search !== "") {
    whereClauses.push(`(
      LOWER(ngo_name) LIKE LOWER(?) OR
      LOWER(city) LIKE LOWER(?) OR
      LOWER(registration_number) LIKE LOWER(?)
    )`);
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  let whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  try {
    const query = `SELECT * FROM ngo_register ${whereSQL} ORDER BY id DESC`;
    const [rows] = await pool.query(query, values);
    
    const processedNGOs = rows.map((ngo) => ({
      ...ngo,
      certificate_url: ngo.registration_certificate || null,
    }));
    const total = rows.length;
    const applied = rows.filter((ngo) => ngo.status === "applied").length;
    const verified = rows.filter((ngo) => ngo.status === "verified").length;
    const suspended = rows.filter((ngo) => ngo.status === "suspended").length;
    
    const citySet = new Set();
    rows.forEach((ngo) => {
      if (ngo.city) citySet.add(ngo.city);
    });
    const cityList = Array.from(citySet);
    
    res.render("admin/VerifyNGOs", {
      ngos: processedNGOs,
      total,
      applied,
      verified,
      suspended,
      filterStatus: status || "",
      filterCity: city || "",
      filterSearch: search || "",
      cityList,
    });
  } catch (err) {
    console.error("Error in /admin/ngos route:", err);
    res.status(500).send("Server error");
  }
});

// Admin: Update NGO status
router.post(
  "/admin/ngos/:id/status",
  ensureNGOAuthenticated,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await pool.query("UPDATE ngo_register SET status = ? WHERE id = ?", [
        status,
        id,
      ]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Serve NGO registration certificate as PDF or image
router.get(
  "/admin/ngos/:id/certificate",
  ensureNGOAuthenticated,
  async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(
        "SELECT registration_certificate FROM ngo_register WHERE id = ?",
        [id]
      );
      if (rows.length === 0 || !rows[0].registration_certificate) {
        return res.status(404).send("Certificate not found");
      }
      const filePath = rows[0].registration_certificate;
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Certificate file not found on server");
      }
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename=certificate${ext}`
      );
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      console.error("Error fetching certificate:", err);
      res.status(500).send("Server error");
    }
  }
);

export default router;