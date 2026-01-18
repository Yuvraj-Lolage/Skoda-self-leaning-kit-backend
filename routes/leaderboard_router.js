const express = require("express");
const { getLeaderboard } = require("../controllers/leaderboard_controller");

const router = express.Router();

/**
 * GET /leaderboard
 * Returns leaderboard data for admin dashboard
 */
router.get("/", getLeaderboard);

module.exports = router;