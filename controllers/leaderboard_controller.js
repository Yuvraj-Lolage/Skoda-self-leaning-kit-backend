const db = require("../config/db");

const getLeaderboard = async (req, res) => {
  try {
    const query = `
      SELECT 
          u.id AS user_id,
          u.name,
          u.email,
          COALESCE(u.xp, 0) AS xp,
          COUNT(DISTINCT up.module_id) AS completedModules,
          (SELECT COUNT(*) FROM modules) AS totalModules,
          ROUND(
            (COUNT(DISTINCT up.module_id) / (SELECT COUNT(*) FROM modules)) * 100
          ) AS progress,
          COALESCE(MAX(ar.first_score), 0) AS latestScore,
          MAX(up.last_accessed) AS lastActive
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN assessment_results ar ON u.id = ar.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.xp DESC, progress DESC
    `;

    const [rows] = await db.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

module.exports = { getLeaderboard };