const lastUpdatedMap = new Map(); // in-memory cache

const THROTTLE_TIME = 60 * 1000; // 1 minute

const updateLastActiveMiddleware = async (req, res, next) => {
  try {
    if (req.path === "/leaderboard") return next();
    const user = req.user;

    if (user) {
      const userId = user.id;
      const now = Date.now();

      const lastUpdated = lastUpdatedMap.get(userId);

      if (!lastUpdated || now - lastUpdated > THROTTLE_TIME) {
        await db.query(
          "UPDATE users SET last_active = NOW() WHERE id = ?",
          [userId]
        );

        lastUpdatedMap.set(userId, now);
      }
    }

    next();
  } catch (err) {
    console.error(err);
    next();
  }
};

module.exports = { updateLastActiveMiddleware };