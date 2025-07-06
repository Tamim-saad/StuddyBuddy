const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { pool } = require("../config/db");
const appConfig = require("../config/appConfig");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

// Generate JWT tokens
function generateTokens(user) {
  const accessToken = jwt.sign(
    { email: user.email, id: user.id },
    appConfig.AUTH.JWT_SECRET,
    { expiresIn: "1d" }
  );
  const refreshToken = jwt.sign(
    { email: user.email, id: user.id },
    appConfig.AUTH.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

// Prepare user object without password_hash and with tokens
function generateUserObject(user) {
  const { password_hash, ...userData } = user;
  const tokens = generateTokens(user);
  return { ...userData, ...tokens };
}

// POST /sign-up
router.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const normalizedEmail = validator.normalizeEmail(email);

    // Check if email already exists
    const existingUserRes = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existingUserRes.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    const insertRes = await pool.query(insertQuery, [name, normalizedEmail, hashedPassword]);
    const user = insertRes.rows[0];

    res.status(201).json(generateUserObject(user));
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { type, email, password, refreshToken } = req.body;

    if (type === "email") {
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const normalizedEmail = validator.normalizeEmail(email);

      // Find user by email
      const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
      const user = userRes.rows[0];
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      res.json(generateUserObject(user));
    } else {
      // Login via refresh token
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
      }

      jwt.verify(refreshToken, appConfig.AUTH.JWT_SECRET, async (err, payload) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [payload.id]);
        const user = userRes.rows[0];
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        res.json(generateUserObject(user));
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// GET / - get all users (without password_hash)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, avatar_url, created_at FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});



// PUT /profile - update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, avatar } = req.body;

    // Validate email if provided
    let normalizedEmail = null;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      normalizedEmail = validator.normalizeEmail(email);

      // Check if email already exists for another user
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id <> $2",
        [normalizedEmail, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Build update query dynamically
    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (normalizedEmail) {
      fields.push(`email = $${idx++}`);
      values.push(normalizedEmail);
    }
    if (avatar !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(avatar);
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(userId);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, avatar_url, created_at`;
    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// PUT /password - update user password
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const userRes = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidCurrent = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidCurrent) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashedPassword, userId]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Error updating password" });
  }
});

// GET /profile - get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Error retrieving profile" });
  }
});
// GET /:id - get user by id (without password_hash)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1",
      [id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
module.exports = router;