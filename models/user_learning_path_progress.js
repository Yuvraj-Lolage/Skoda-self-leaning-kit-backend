const db = require("../config/db");

class UserLearningPathProgress {
  static async getByUserAndTrack(userId, trackId) {
    const [rows] = await db.execute(
      `SELECT * FROM user_learning_path_progress WHERE user_id = ? AND track_id = ?`,
      [userId, trackId]
    );
    return rows[0] || null;
  }

  static async ensureRow(userId, trackId) {
    const [totalRows] = await db.execute(
      `SELECT COUNT(*) AS c FROM modules`
    );
    const totalModules = Number(totalRows[0]?.c || 0);

    await db.execute(
      `
      INSERT INTO user_learning_path_progress
        (user_id, track_id, status, total_modules_count, last_accessed_at)
      VALUES (?, ?, 'not_started', ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_modules_count = VALUES(total_modules_count),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, trackId, totalModules]
    );

    return UserLearningPathProgress.getByUserAndTrack(userId, trackId);
  }

  static async touchInProgress(userId, trackId, currentModuleId) {
    await db.execute(
      `
      INSERT INTO user_learning_path_progress
        (user_id, track_id, status, current_module_id, started_at, last_accessed_at)
      VALUES (?, ?, 'in_progress', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        status = IF(status = 'completed', status, 'in_progress'),
        started_at = IF(started_at IS NULL, VALUES(started_at), started_at),
        current_module_id = VALUES(current_module_id),
        last_accessed_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, trackId, currentModuleId]
    );
  }

  static async recalculate(userId, trackId) {
    const [completedRows] = await db.execute(
      `
      SELECT COUNT(*) AS c
      FROM user_module_progress
      WHERE user_id = ? AND track_id = ? AND status = 'completed'
      `,
      [userId, trackId]
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS c FROM modules`);
    const completedCount = Number(completedRows[0]?.c || 0);
    const totalCount = Number(totalRows[0]?.c || 0);
    const percent =
      totalCount > 0 ? Math.round((completedCount * 10000) / totalCount) / 100 : 0;

    const allDone = totalCount > 0 && completedCount >= totalCount;

    const [firstIncomplete] = await db.execute(
      `
      SELECT m.module_id
      FROM modules m
      LEFT JOIN user_module_progress ump
        ON ump.user_id = ? AND ump.track_id = ? AND ump.module_id = m.module_id
      WHERE COALESCE(ump.status, 'not_started') <> 'completed'
      ORDER BY m.order_index ASC
      LIMIT 1
      `,
      [userId, trackId]
    );

    const [secondIncomplete] = await db.execute(
      `
      SELECT m.module_id
      FROM modules m
      LEFT JOIN user_module_progress ump
        ON ump.user_id = ? AND ump.track_id = ? AND ump.module_id = m.module_id
      WHERE COALESCE(ump.status, 'not_started') <> 'completed'
      ORDER BY m.order_index ASC
      LIMIT 1 OFFSET 1
      `,
      [userId, trackId]
    );

    const currentModuleId = firstIncomplete[0]?.module_id ?? null;
    const nextModuleId = secondIncomplete[0]?.module_id ?? null;

    await db.execute(
      `
      UPDATE user_learning_path_progress
      SET
        completed_modules_count = ?,
        total_modules_count = ?,
        completion_percent = ?,
        status = ?,
        current_module_id = ?,
        next_module_id = ?,
        completed_at = IF(? = 'completed' AND completed_at IS NULL, NOW(), completed_at),
        last_accessed_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND track_id = ?
      `,
      [
        completedCount,
        totalCount,
        percent,
        allDone ? "completed" : "in_progress",
        allDone ? null : currentModuleId,
        allDone ? null : nextModuleId,
        allDone ? "completed" : "in_progress",
        userId,
        trackId,
      ]
    );

    return UserLearningPathProgress.getByUserAndTrack(userId, trackId);
  }
}

module.exports = { UserLearningPathProgress };
