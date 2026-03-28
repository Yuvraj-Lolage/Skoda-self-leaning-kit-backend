const db = require("../config/db");
const { Assessment } = require("./Assignment");
const { AssessmentResult } = require("./assessment_result");

/**
 * Linear path within a module: each submodule, then its assessments (by assessment_id).
 * Module is completed only when every submodule is completed and every assessment is passed.
 * Course module order: first module with any incomplete step is in_progress; earlier completed; later locked.
 */
class TrainingModulesCatalog {
  static _groupAssessmentsBySubmodule(assessmentRows) {
    const map = new Map();
    for (const a of assessmentRows) {
      const sid = Number(a.submodule_id);
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid).push(a);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => Number(x.assessment_id) - Number(y.assessment_id));
    }
    return map;
  }

  static _buildSteps(moduleId, subs, assessmentsBySubId) {
    const steps = [];
    for (const s of subs) {
      const sid = Number(s.submodule_id);
      steps.push({ kind: "submodule", submoduleId: sid });
      const arr = assessmentsBySubId.get(sid) || [];
      for (const a of arr) {
        steps.push({
          kind: "assessment",
          assessmentId: Number(a.assessment_id),
          submoduleId: sid,
          title: a.title,
          description: a.description,
        });
      }
    }
    return steps;
  }

  static _isModuleFullyComplete(steps, progressBySubmoduleId, submittedAssessmentIds) {
    if (steps.length === 0) return true;
    for (const st of steps) {
      if (st.kind === "submodule") {
        if (progressBySubmoduleId.get(st.submoduleId) !== "completed") return false;
      } else if (!submittedAssessmentIds.has(st.assessmentId)) {
        return false;
      }
    }
    return true;
  }

  static _firstIncompleteStepIndex(steps, progressBySubmoduleId, submittedAssessmentIds) {
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      if (st.kind === "submodule") {
        if (progressBySubmoduleId.get(st.submoduleId) !== "completed") return i;
      } else if (!submittedAssessmentIds.has(st.assessmentId)) {
        return i;
      }
    }
    return -1;
  }

  static async _nextSubmoduleIdAfter(moduleId, orderIndex) {
    const [rows] = await db.execute(
      `
      SELECT submodule_id FROM submodules
      WHERE module_id = ? AND order_index > ?
      ORDER BY order_index ASC, submodule_id ASC
      LIMIT 1
      `,
      [moduleId, orderIndex]
    );
    return rows[0] ? Number(rows[0].submodule_id) : null;
  }

  /**
   * Upsert user_module_progress from submodule + assessment completion (single module).
   * @returns {Promise<{ moduleCompleted: boolean, completedSteps: number, totalSteps: number, currentSubmoduleId: number|null, nextSubmoduleId: number|null }>}
   */
  static async syncUserModuleProgressRow(userId, trackId, moduleId) {
    const modId = Number(moduleId);
    const [subRows] = await db.execute(
      `
      SELECT submodule_id, module_id, order_index
      FROM submodules
      WHERE module_id = ?
      ORDER BY order_index ASC, submodule_id ASC
      `,
      [modId]
    );

    const summaries = await Assessment.getAssessmentSummariesByModule(modId);
    const assessmentsBySubId = this._groupAssessmentsBySubmodule(summaries);
    const steps = this._buildSteps(modId, subRows, assessmentsBySubId);

    const [uspRows] = await db.execute(
      `
      SELECT submodule_id, status
      FROM user_submodule_progress
      WHERE user_id = ? AND track_id = ? AND module_id = ?
      `,
      [userId, trackId, modId]
    );
    const progressBySubmoduleId = new Map();
    for (const row of uspRows) {
      progressBySubmoduleId.set(Number(row.submodule_id), row.status);
    }

    const submittedAssessmentIds =
      await AssessmentResult.getSubmittedAssessmentIdSetForUser(userId);

    const totalSteps = steps.length;
    let completedSteps = 0;
    for (const st of steps) {
      if (st.kind === "submodule") {
        if (progressBySubmoduleId.get(st.submoduleId) === "completed") completedSteps += 1;
      } else if (submittedAssessmentIds.has(st.assessmentId)) {
        completedSteps += 1;
      }
    }

    const moduleCompleted =
      totalSteps === 0 ? subRows.length === 0 : completedSteps >= totalSteps;

    const fi = this._firstIncompleteStepIndex(
      steps,
      progressBySubmoduleId,
      submittedAssessmentIds
    );

    let currentSubmoduleId = null;
    let nextSubmoduleId = null;

    if (!moduleCompleted && fi >= 0) {
      const inc = steps[fi];
      const parentSubId = inc.submoduleId;
      currentSubmoduleId = parentSubId;
      const subRow = subRows.find((r) => Number(r.submodule_id) === parentSubId);
      if (subRow) {
        nextSubmoduleId = await this._nextSubmoduleIdAfter(
          modId,
          Number(subRow.order_index)
        );
      }
    }

    const percent =
      totalSteps > 0
        ? Math.round((completedSteps * 10000) / totalSteps) / 100
        : subRows.length === 0
          ? 100
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
        modId,
        status,
        percent,
        currentSubmoduleId,
        nextSubmoduleId,
        status,
      ]
    );

    return {
      moduleCompleted,
      completedSteps,
      totalSteps,
      currentSubmoduleId,
      nextSubmoduleId,
    };
  }

  static async getCatalogForUser(userId, trackId) {
    const [moduleRows] = await db.execute(
      `SELECT module_id, name, description, order_index, duration, created_at
       FROM modules
       ORDER BY order_index ASC, module_id ASC`
    );

    const [submoduleRows] = await db.execute(
      `SELECT submodule_id, module_id, name, description, content_type, content_url,
              order_index, duration, created_at
       FROM submodules
       ORDER BY module_id ASC, order_index ASC, submodule_id ASC`
    );

    const [uspRows] = await db.execute(
      `SELECT submodule_id, module_id, status
       FROM user_submodule_progress
       WHERE user_id = ? AND track_id = ?`,
      [userId, trackId]
    );

    const progressBySubmoduleId = new Map();
    for (const row of uspRows) {
      progressBySubmoduleId.set(Number(row.submodule_id), row.status);
    }

    const submittedAssessmentIds =
      await AssessmentResult.getSubmittedAssessmentIdSetForUser(userId);

    const subsByModuleId = new Map();
    for (const s of submoduleRows) {
      const mid = Number(s.module_id);
      if (!subsByModuleId.has(mid)) subsByModuleId.set(mid, []);
      subsByModuleId.get(mid).push(s);
    }

    const [allAssessmentRows] = await db.execute(
      `SELECT assessment_id, module_id, submodule_id, title, description, created_at
       FROM assessments
       ORDER BY module_id ASC, submodule_id ASC, assessment_id ASC`
    );

    const assessmentsByModuleId = new Map();
    for (const a of allAssessmentRows) {
      const mid = Number(a.module_id);
      if (!assessmentsByModuleId.has(mid)) assessmentsByModuleId.set(mid, []);
      assessmentsByModuleId.get(mid).push(a);
    }

    const orderedModules = moduleRows.map((m) => ({
      ...m,
      module_id: Number(m.module_id),
      order_index: Number(m.order_index),
    }));

    const moduleCompletion = orderedModules.map((m) => {
      const subs = subsByModuleId.get(m.module_id) || [];
      const aRows = assessmentsByModuleId.get(m.module_id) || [];
      const bySub = this._groupAssessmentsBySubmodule(aRows);
      const steps = this._buildSteps(m.module_id, subs, bySub);
      const completed = this._isModuleFullyComplete(
        steps,
        progressBySubmoduleId,
        submittedAssessmentIds
      );
      return {
        completed,
        totalSteps: steps.length,
        steps,
      };
    });

    let firstIncompleteIndex = -1;
    for (let i = 0; i < orderedModules.length; i++) {
      if (!moduleCompletion[i].completed) {
        firstIncompleteIndex = i;
        break;
      }
    }

    const totalCompletedModules =
      firstIncompleteIndex === -1 ? orderedModules.length : firstIncompleteIndex;

    const modulesOut = orderedModules.map((m, idx) => {
      let moduleStatus;
      if (firstIncompleteIndex === -1) {
        moduleStatus = "completed";
      } else if (idx < firstIncompleteIndex) {
        moduleStatus = "completed";
      } else if (idx === firstIncompleteIndex) {
        moduleStatus = "in_progress";
      } else {
        moduleStatus = "locked";
      }

      const subs = subsByModuleId.get(m.module_id) || [];
      const aRows = assessmentsByModuleId.get(m.module_id) || [];
      const assessmentsBySubId = this._groupAssessmentsBySubmodule(aRows);
      const steps = moduleCompletion[idx].steps;

      const fi =
        moduleStatus === "locked"
          ? 0
          : moduleStatus === "completed"
            ? -1
            : this._firstIncompleteStepIndex(
                steps,
                progressBySubmoduleId,
                submittedAssessmentIds
              );

      const submodulesOut = subs.map((s) => {
        const sid = Number(s.submodule_id);
        const subAssessments = (assessmentsBySubId.get(sid) || []).map((a) => {
          const aid = Number(a.assessment_id);
          let aStatus;
          if (moduleStatus === "locked") {
            aStatus = "locked";
          } else if (moduleStatus === "completed") {
            aStatus = "completed";
          } else {
            const stepIdx = steps.findIndex(
              (st) => st.kind === "assessment" && st.assessmentId === aid
            );
            if (stepIdx === -1) aStatus = "locked";
            else if (fi === -1) aStatus = "completed";
            else if (stepIdx < fi) aStatus = "completed";
            else if (stepIdx === fi) aStatus = "in_progress";
            else aStatus = "locked";
          }
          if (submittedAssessmentIds.has(aid)) aStatus = "completed";

          return {
            assessment_id: aid,
            module_id: Number(a.module_id),
            submodule_id: sid,
            title: a.title,
            description: a.description,
            created_at: a.created_at,
            status: aStatus,
          };
        });

        let subStatus;
        if (moduleStatus === "locked") {
          subStatus = "locked";
        } else if (moduleStatus === "completed") {
          subStatus = "completed";
        } else {
          const stepIdx = steps.findIndex(
            (st) => st.kind === "submodule" && st.submoduleId === sid
          );
          if (stepIdx === -1) subStatus = "locked";
          else if (fi === -1) subStatus = "completed";
          else if (stepIdx < fi) subStatus = "completed";
          else if (stepIdx === fi) subStatus = "in_progress";
          else subStatus = "locked";
        }

        return {
          submodule_id: sid,
          module_id: Number(s.module_id),
          name: s.name,
          description: s.description,
          content_type: s.content_type,
          content_url: s.content_url,
          order_index: Number(s.order_index),
          duration: s.duration,
          created_at: s.created_at,
          status: subStatus,
          assessments: subAssessments,
        };
      });

      const mc = moduleCompletion[idx];

      return {
        module_id: m.module_id,
        name: m.name,
        description: m.description,
        order_index: m.order_index,
        duration: m.duration,
        created_at: m.created_at,
        status: moduleStatus,
        submodule_count: subs.length,
        assessment_count: aRows.length,
        completed_submodule_count: subs.filter(
          (s) => progressBySubmoduleId.get(Number(s.submodule_id)) === "completed"
        ).length,
        submodules: submodulesOut,
      };
    });

    return {
      trackId,
      total_completed_modules: totalCompletedModules,
      modules: modulesOut,
    };
  }
}

module.exports = { TrainingModulesCatalog };
