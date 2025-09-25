import express from "express";
import { query } from "../db.js";
import { ensureUserAuthenticated, ensureNGOAuthenticated, ensureVolunteerAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// NGO Dashboard
router.get("/dashboard/ngo", ensureNGOAuthenticated, async (req, res) => {
  try {
    const ngoId = req.session.ngo?.id || req.session.user?.id;
    
    // Get pending donations
    const pendingResult = await query(
      "SELECT * FROM donations WHERE status = 'pending' ORDER BY created_at DESC"
    );
    
    // Get confirmed donations (assigned or picked up)
    const confirmedResult = await query(
      "SELECT * FROM donations WHERE status IN ('assigned', 'picked_up') ORDER BY assigned_at DESC"
    );
    
    // Get completed donations
    const completedResult = await query(
      "SELECT * FROM donations WHERE status = 'delivered' OR status = 'completed' ORDER BY updated_at DESC"
    );
    
    // Get assigned volunteers (unique volunteers with active donations)
    const volunteersResult = await query(`
      SELECT DISTINCT volunteer_name, volunteer_phone, 
             COUNT(*) as active_donations,
             MIN(city) as city
      FROM donations 
      WHERE volunteer_name IS NOT NULL 
        AND status IN ('assigned', 'picked_up')
      GROUP BY volunteer_name, volunteer_phone
    `);
    
    res.render("dashboards/ngo-dashboard", {
      currentPage: 'ngo-dashboard',
      ngo: req.session.ngo || req.session.user,
      pendingDonations: pendingResult.rows,
      confirmedDonations: confirmedResult.rows,
      completedDonations: completedResult.rows,
      assignedVolunteers: volunteersResult.rows
    });
  } catch (err) {
    console.error("NGO Dashboard error:", err);
    res.status(500).send("Server error");
  }
});

// Volunteer Dashboard
router.get("/dashboard/volunteer", ensureVolunteerAuthenticated, async (req, res) => {
  try {
    const volunteerId = req.session.volunteer.id;
    const volunteerCity = req.session.volunteer.city;
    
    // Get available donations in volunteer's city
    const availableResult = await query(`
      SELECT d.*, u.fullname as donor_name 
      FROM donations d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.city = $1 AND d.volunteer_id IS NULL AND d.status = 'pending'
      ORDER BY d.created_at DESC
    `, [volunteerCity]);
    
    // Get volunteer's assigned donations
    const myDonationsResult = await query(`
      SELECT d.*, u.fullname as donor_name, n.ngo_name
      FROM donations d 
      LEFT JOIN users u ON d.user_id = u.id 
      LEFT JOIN ngo_register n ON d.ngo_id = n.id
      WHERE d.volunteer_id = $1 
      ORDER BY CASE 
        WHEN d.status = 'assigned' THEN 1
        WHEN d.status = 'picked_up' THEN 2
        WHEN d.status = 'delivered' THEN 3
        WHEN d.status = 'completed' THEN 4
        ELSE 5
      END, d.created_at DESC
    `, [volunteerId]);
    
    res.render("dashboards/volunteer-dashboard", {
      currentPage: 'volunteer-dashboard',
      volunteer: req.session.volunteer,
      availableDonations: availableResult.rows,
      myDonations: myDonationsResult.rows
    });
  } catch (err) {
    console.error("Volunteer Dashboard error:", err);
    res.status(500).send("Server error");
  }
});

// Donor Dashboard
router.get("/dashboard/donor", ensureUserAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get donor's donation history
    const donationsResult = await query(`
      SELECT d.*, v.fullname as volunteer_name, v.phone as volunteer_phone, n.ngo_name
      FROM donations d 
      LEFT JOIN volunteers v ON d.volunteer_id = v.id
      LEFT JOIN ngo_register n ON d.ngo_id = n.id
      WHERE d.user_id = $1 
      ORDER BY d.created_at DESC
    `, [userId]);
    
    // Get donation statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_donations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'picked_up' THEN 1 END) as picked_up,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed
      FROM donations 
      WHERE user_id = $1
    `, [userId]);
    
    res.render("dashboards/donor-dashboard", {
      currentPage: 'donor-dashboard',
      user: req.session.user,
      donations: donationsResult.rows,
      stats: statsResult.rows[0] || {}
    });
  } catch (err) {
    console.error("Donor Dashboard error:", err);
    res.status(500).send("Server error");
  }
});

// API endpoints for real-time updates
router.get("/api/ngo/dashboard-data", ensureNGOAuthenticated, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status IN ('assigned', 'picked_up') THEN 1 END) as confirmed,
        COUNT(DISTINCT volunteer_name) as volunteers,
        COUNT(CASE WHEN status IN ('delivered', 'completed') THEN 1 END) as completed
      FROM donations
    `);
    
    res.json({ stats: stats.rows[0] });
  } catch (err) {
    console.error("Dashboard API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark donation as completed
router.post("/ngo/complete-donation/:id", ensureNGOAuthenticated, async (req, res) => {
  try {
    const donationId = req.params.id;
    
    await query(
      "UPDATE donations SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [donationId]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("Complete donation error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;