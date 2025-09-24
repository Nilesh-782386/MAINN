import express from "express";
import { pool } from "../db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { ensureVolunteerAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Upload storage for delivery proof
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "upload");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}-volunteer-${req.session.volunteer.id}${ext}`);
  }
});
const upload = multer({ storage });

// Volunteer Dashboard Data
router.get("/volunteer-dashboard-data", ensureVolunteerAuthenticated, async (req, res) => {
  const volunteerId = req.session.volunteer.id;
  
  try {
    const [availableDonations] = await pool.query(`
      SELECT d.*, u.fullname as donor_name 
      FROM donations d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.city = ? AND d.volunteer_id IS NULL AND d.status = 'pending'
      ORDER BY d.created_at DESC
    `, [req.session.volunteer.city]);

    const [myDonations] = await pool.query(`
      SELECT d.*, u.fullname as donor_name, n.ngo_name
      FROM donations d 
      LEFT JOIN users u ON d.user_id = u.id 
      LEFT JOIN ngo_register n ON d.ngo_id = n.id
      WHERE d.volunteer_id = ? 
      ORDER BY FIELD(d.status, 'accepted', 'picked_up', 'delivered', 'completed'), d.created_at DESC
    `, [volunteerId]);

    res.json({
      volunteer: req.session.volunteer,
      availableDonations,
      myDonations
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Accept donation
router.post("/accept-donation/:id", ensureVolunteerAuthenticated, async (req, res) => {
  const donationId = req.params.id;
  const volunteerId = req.session.volunteer.id;

  try {
    await pool.query(
      "UPDATE donations SET volunteer_id = ?, volunteer_name = ?, volunteer_phone = ?, status = 'assigned', assigned_at = NOW() WHERE id = ? AND volunteer_id IS NULL",
      [
        volunteerId,
        req.session.volunteer.name || req.session.volunteer.fullname || req.session.volunteer.email,
        req.session.volunteer.phone || '',
        donationId
      ]
    );
    
    res.json({ success: true, message: "Donation accepted successfully" });
  } catch (err) {
    console.error("Accept error:", err);
    res.json({ success: false, message: "Failed to accept donation" });
  }
});

// Update donation status
router.post("/update-status/:id", ensureVolunteerAuthenticated, async (req, res) => {
  const { status } = req.body;
  const donationId = req.params.id;
  const volunteerId = req.session.volunteer.id;

  try {
    await pool.query(
      "UPDATE donations SET status = ? WHERE id = ? AND volunteer_id = ?",
      [status, donationId, volunteerId]
    );

    if (status === 'completed') {
      await pool.query(
        "UPDATE volunteers SET completed_donations = completed_donations + 1 WHERE id = ?",
        [volunteerId]
      );
    }

    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("Status update error:", err);
    res.json({ success: false, message: "Failed to update status" });
  }
});

export default router;

// Upload proof of delivery
router.post("/volunteer/proof/:id", ensureVolunteerAuthenticated, upload.single("proof"), async (req, res) => {
  const donationId = req.params.id;
  const filePath = `/uploads/${path.basename(req.file.path)}`;
  try {
    await pool.query(
      "UPDATE donations SET proof_image = ?, status = 'delivered' WHERE id = ? AND volunteer_id = ?",
      [filePath, donationId, req.session.volunteer.id]
    );
    res.json({ success: true, file: filePath });
  } catch (err) {
    console.error("Proof upload error:", err);
    res.status(500).json({ success: false });
  }
});