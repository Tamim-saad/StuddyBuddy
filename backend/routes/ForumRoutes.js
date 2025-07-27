const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateStickyNotes } = require('../utils/stickynotesGenerator');
const { client } = require('../utils/qdrantClient');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

router.post("/", authenticateToken, async (req, res) => {
    const user_id=req.user.id;
    const {shared_quiz}=req.body;
    
    const result = await pool.query(
          `INSERT INTO FORUMQUIZ (
            user_id,
            shared_quiz
          ) VALUES ($1, $2) 
          RETURNING *`,
          [
            user_id,
            shared_quiz
          ]
        );
    console.log("Result",result);    
    // res.status(201).json(result.rows[0]);    


});
module.exports = router;