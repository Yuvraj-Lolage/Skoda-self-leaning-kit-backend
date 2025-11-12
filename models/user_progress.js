const db = require("../config/db");

class UserProgress {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.module_id = data.module_id;
        this.completed_submodules = data.completed_submodules;
        this.current_submodule_id = data.current_submodule_id;
        this.next_submodule_id = data.next_submodule_id;
        this.last_accessed = data.last_accessed;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ➤ Create a new progress record
    static async create(progressData) {
        const sql = `
      INSERT INTO user_progress 
      (user_id, module_id, completed_submodules, current_submodule_id, next_submodule_id, last_accessed)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        completed_submodules = VALUES(completed_submodules),
        current_submodule_id = VALUES(current_submodule_id),
        next_submodule_id = VALUES(next_submodule_id),
        last_accessed = NOW(),
        updated_at = NOW()
    `;
        const values = [
            progressData.user_id,
            progressData.module_id,
            JSON.stringify(progressData.completed_submodules || []),
            progressData.current_submodule_id || null,
            progressData.next_submodule_id || null,
        ];
        const [result] = await db.execute(sql, values);
        return result;
    }

    // ➤ Get progress by user and module
    static async getByUserAndModule(userId, moduleId) {
        const [rows] = await db.execute(
            "SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?",
            [userId, moduleId]
        );
        return rows.length ? new UserProgress(rows[0]) : null;
    }

    // ➤ Update progress (e.g., when user completes a submodule)
    static async updateProgress(userId, moduleId, updates) {
        const fields = [];
        const values = [];

        if (updates.completed_submodules) {
            fields.push("completed_submodules = ?");
            values.push(JSON.stringify(updates.completed_submodules));
        }
        if (updates.current_submodule_id !== undefined) {
            fields.push("current_submodule_id = ?");
            values.push(updates.current_submodule_id);
        }
        if (updates.next_submodule_id !== undefined) {
            fields.push("next_submodule_id = ?");
            values.push(updates.next_submodule_id);
        }

        fields.push("last_accessed = NOW()");
        fields.push("updated_at = NOW()");

        const sql = `
      UPDATE user_progress
      SET ${fields.join(", ")}
      WHERE user_id = ? AND module_id = ?
    `;
        values.push(userId, moduleId);

        const [result] = await db.execute(sql, values);
        return result;
    }

    // ➤ Get all progress records for a user
    static async getAllByUser(userId) {
        const query = `
      SELECT 
        id,
        user_id,
        module_id,
        completed_submodules,
        current_submodule_id,
        next_submodule_id,
        last_accessed,
        created_at,
        updated_at
      FROM user_progress
      WHERE user_id = 2;
    `;

        try {
            const [rows] = await db.query(query);

            // Safely parse JSON field (completed_submodules)
            return rows.map(row => ({
                id: row.id,
                user_id: row.user_id,
                module_id: row.module_id,
                completed_submodules: row.completed_submodules
                    ? JSON.parse(row.completed_submodules)
                    : [],
                current_submodule_id: row.current_submodule_id,
                next_submodule_id: row.next_submodule_id,
                last_accessed: row.last_accessed,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }));
        } catch (error) {
            console.error("Error in getAllByUser:", error);
            throw error;
        }
    }

    // ➤ Delete progress (optional helper)
    static async delete(userId, moduleId) {
        const [result] = await db.execute(
            "DELETE FROM user_progress WHERE user_id = ? AND module_id = ?",
            [userId, moduleId]
        );
        return result;
    }
}

module.exports = {
    UserProgress
};
