import express from "express";
import { pool } from "../db.js";
import { ensureUserAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/submit-donation", ensureUserAuthenticated, async (req, res) => {
  const {
    books = 0,
    clothes = 0,
    grains = 0,
    footwear = 0,
    toys = 0,
    schoolSupplies = 0,
  } = req.body;
  const userId = req.session.user.id;
  try {
    const [result] = await pool.query(
      `INSERT INTO donations (books, clothes, grains, footwear, toys, schoolSupplies, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [books, clothes, grains, footwear, toys, schoolSupplies, userId]
    );
    const donationId = result.insertId;
    res.redirect(`/submit-info?donationId=${donationId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/submit-info", ensureUserAuthenticated, async (req, res) => {
  const {
    donationId,
    fname,
    lname,
    email,
    phone,
    phone2,
    flat,
    addline,
    land,
    city,
    state,
    pincode,
    optnote,
  } = req.body;
  try {
    await pool.query(
      `UPDATE donations SET fname = ?, lname = ?, email = ?, phone = ?, phone2 = ?, flat = ?, addline = ?, land = ?, city = ?, state = ?, pincode = ?, optnote = ? WHERE id = ?`,
      [
        fname,
        lname,
        email,
        phone,
        phone2,
        flat,
        addline,
        land,
        city,
        state,
        pincode,
        optnote,
        donationId,
      ]
    );
    res.redirect(`/donated?donationId=${donationId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/donated", ensureUserAuthenticated, async (req, res) => {
  const { date, time, donationId } = req.body;
  try {
    // ✅ FIX: Convert "9:00 AM" to "09:00:00" format
    const convertTo24Hour = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours) + 12);
      if (modifier === 'AM' && hours === '12') hours = '00';
      return `${hours.padStart(2, '0')}:${minutes}:00`;
    };

    const mysqlTime = convertTo24Hour(time);
    await pool.query(
      `UPDATE donations SET pickup_date = ?, pickup_time = ? WHERE id = ?`,
      [date, mysqlTime, donationId]
    );
    res.render("index");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/donations/:id/complete", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE donations SET status = 'completed' WHERE id = ?",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/donations/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE donations SET status = 'cancelled' WHERE id = ?",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;