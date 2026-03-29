const db = require("../config/db");

class UserSubmoduleProgress {
  static async upsertStart(userId, trackId, moduleId, submoduleId) {
    await db.execute(
      `
      INSERT INTO user_submodule_progress
        (user_id, track_id, module_id, submodule_id, status, started_at, last_accessed_at)
      VALUES (?, ?, ?, ?, 'in_progress', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        status = IF(status = 'completed', status, 'in_progress'),
        started_at = IF(started_at IS NULL, VALUES(started_at), started_at),
        last_accessed_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, trackId, moduleId, submoduleId]
    );
  }

  static async markCompleted(userId, trackId, moduleId, submoduleId) {
    await db.execute(
      `
      INSERT INTO user_submodule_progress
        (user_id, track_id, module_id, submodule_id, status, completion_percent,
         started_at, completed_at, last_accessed_at)
      VALUES (?, ?, ?, ?, 'completed', 100.00, NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        status = 'completed',
        completion_percent = 100.00,
        completed_at = IF(completed_at IS NULL, NOW(), completed_at),
        last_accessed_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, trackId, moduleId, submoduleId]
    );
  }

  static async countCompletedInModule(userId, moduleId) {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS c
      FROM user_submodule_progress
      WHERE user_id = ? AND module_id = ? AND status = 'completed'
      `,
      [userId, moduleId]
    );
    return Number(rows[0]?.c || 0);
  }
}

module.exports = { UserSubmoduleProgress };
