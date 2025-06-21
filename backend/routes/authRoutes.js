
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const appConfig = require("../config/appConfig");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    console.log("Google token verified for:", email);

    // Check if user exists
    let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user = result.rows[0];

    if (!user) {
      // Create new user with random password hash
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const insertQuery = `
        INSERT INTO users (name, email, avatar_url, created_at, password_hash)
        VALUES ($1, $2, $3, NOW(), $4)
        RETURNING *;
      `;

      result = await pool.query(insertQuery, [
        payload.name,
        email,
        payload.picture,
        hashedPassword,
      ]);
      user = result.rows[0];
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Prepare user object to send (remove password_hash)
    const { password_hash, ...userObj } = user;
    userObj.accessToken = accessToken;
    userObj.refreshToken = refreshToken;

    res.status(200).json(userObj);
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      email: user.email,
      id: user.id,
    },
    appConfig.AUTH.JWT_SECRET,
    { expiresIn: "1d" }
  );
  const refreshToken = jwt.sign(
    {
      email: user.email,
      id: user.id,
    },
    appConfig.AUTH.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

module.exports = router;
