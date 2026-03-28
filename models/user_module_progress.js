const db = require("../config/db");

class UserModuleProgress {
  static async getByUserAndModule(userId, moduleId) {
    const [rows] = await db.execute(
      `SELECT * FROM user_module_progress WHERE user_id = ? AND module_id = ?`,
      [userId, moduleId]
    );
    return rows[0] || null;
  }

  static async upsertStart(userId, trackId, moduleId, currentSubmoduleId, nextSubmoduleId) {
    await db.execute(
      `
      INSERT INTO user_module_progress
        (user_id, track_id, module_id, status, started_at, last_accessed_at,
         current_submodule_id, next_submodule_id)
      VALUES (?, ?, ?, 'in_progress', NOW(), NOW(), ?, ?)
      ON DUPLICATE KEY UPDATE
        status = IF(status = 'completed', status, 'in_progress'),
        started_at = IF(started_at IS NULL, VALUES(started_at), started_at),
        current_submodule_id = VALUES(current_submodule_id),
        next_submodule_id = VALUES(next_submodule_id),
        last_accessed_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, trackId, moduleId, currentSubmoduleId, nextSubmoduleId]
    );
  }

  static async updateFromSubmoduleCounts(
    userId,
    trackId,
    moduleId,
    completedCount,
    totalCount,
    currentSubmoduleId,
    nextSubmoduleId
  ) {
    const moduleCompleted = totalCount > 0 && completedCount >= totalCount;
    const percent =
      totalCount > 0
        ? Math.round((completedCount * 10000) / totalCount) / 100
        : 0;
    const status = moduleCompleted ? "completed" : "in_progress";

    await db.execute(
      `
      INSERT INTO user_module_progress
        (user_id, track_id, module_id, status, completion_percent,
         current_submodule_id, next_submodule_id, started_at, last_accessed_at,
         completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), IF(? = 'completed', NOW(), NULL))
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        completion_percent = VALUES(completion_percent),
        current_submodule_id = VALUES(current_submodule_id),
        next_submodule_id = VALUES(next_submodule_id),
        completed_at = IF(
          VALUES(status) = 'completed' AND completed_at IS NULL,
          NOW(),
          completed_at
        ),
        last_accessed_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        userId,
        trackId,
        moduleId,
        status,
        percent,
        currentSubmoduleId,
        nextSubmoduleId,
        status,
      ]
    );
  }
}

module.exports = { UserModuleProgress };
