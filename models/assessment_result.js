const db = require("../config/db");

class AssessmentResult {
    static async createFirstAttempt({
        userId,
        assessmentId,
        moduleId,
        score,
        duration
    }) {
        const status = score >= 60 ? "PASSED" : "FAILED";

        const attempts = [
            {
                attemptNo: 1,
                score,
                duration,
                status,
                attemptedAt: new Date()
            }
        ];

        const sql = `
      INSERT INTO assessment_results (
        user_id,
        assessment_id,
        module_id,
        attempts,
        first_score,
        total_attempts
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        const values = [
            userId,
            assessmentId,
            moduleId,
            JSON.stringify(attempts),
            score,
            1
        ];

        const [result] = await db.query(sql, values);
        return result;
    }


    /**
       * Submit assessment attempt (INSERT or UPDATE)
       */
    static async submitAttempt({
        userId,
        assessmentId,
        moduleId,
        score,
        duration
    }) {
        const conn = await db.getConnection();
        const status = score >= 6 ? "PASSED" : "FAILED";

        try {
            await conn.beginTransaction();

            // 1️⃣ Lock row (if exists)
            const [rows] = await conn.query(
                `SELECT attempts, total_attempts
         FROM assessment_results
         WHERE user_id = ? AND assessment_id = ?
         FOR UPDATE`,
                [userId, assessmentId]
            );

            // 2️⃣ FIRST ATTEMPT → INSERT
            if (rows.length === 0) {
                const attempts = [
                    {
                        attemptNo: 1,
                        score,
                        duration,
                        status,
                        attemptedAt: new Date()
                    }
                ];

                await conn.query(
                    `INSERT INTO assessment_results
           (user_id, assessment_id, module_id, attempts, first_score, total_attempts)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        assessmentId,
                        moduleId,
                        JSON.stringify(attempts),
                        score,
                        1
                    ]
                );

                await conn.commit();
                return { attemptNo: 1, status };
            }

            // 3️⃣ RETRY → UPDATE
            const { attempts, total_attempts } = rows[0];

            const newAttemptNo = total_attempts + 1;

            await conn.query(
                `UPDATE assessment_results
         SET attempts = JSON_ARRAY_APPEND(
               attempts, '$',
               JSON_OBJECT(
                 'attemptNo', ?,
                 'score', ?,
                 'duration', ?,
                 'status', ?,
                 'attemptedAt', NOW()
               )
             ),
             total_attempts = ?
         WHERE user_id = ? AND assessment_id = ?`,
                [
                    newAttemptNo,
                    score,
                    duration,
                    status,
                    newAttemptNo,
                    userId,
                    assessmentId
                ]
            );

            await conn.commit();
            return { attemptNo: newAttemptNo, status };

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }


    //get modules by user
    static async getModulesByUser(userId) {
    const [rows] = await db.query(
      `
      SELECT DISTINCT module_id
      FROM assessment_results
      WHERE user_id = ?
      ORDER BY module_id
      `,
      [userId]
    );
    return rows.map(r => r.module_id);
  }

  //get results by user and module

  static async getResultsByUserAndModule(userId, moduleId) {
    const [rows] = await db.query(
      `
      SELECT
        result_id,
        user_id,
        module_id,
        assessment_id,
        attempts,
        first_score,
        total_attempts,
        created_at,
        last_updated
      FROM assessment_results
      WHERE user_id = ?
        AND module_id = ?
      ORDER BY assessment_id
      `,
      [userId, moduleId]
    );
    return rows;
  }

  /**
   * Module / catalog progression: any submitted attempt (pass or fail) completes the step.
   * @returns {Set<number>}
   */
  static async getSubmittedAssessmentIdSetForUser(userId) {
    const [rows] = await db.query(
      `SELECT assessment_id FROM assessment_results WHERE user_id = ?`,
      [userId]
    );
    return new Set(rows.map((r) => Number(r.assessment_id)));
  }
}


module.exports = {
    AssessmentResult
}