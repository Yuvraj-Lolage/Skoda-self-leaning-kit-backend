const { UserProgress } = require("../models/user_progress");
const { SubModule } = require("../models/sub_module");
const { Modules } = require('../models/modules');

const completeSubmodule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId, submoduleId } = req.body;

    if (!moduleId || !submoduleId) {
      return res.status(400).json({ message: "Missing data" });
    }

    // 1️⃣ Fetch current module progress
    // const existing = await UserProgress.getProgress(userId, moduleId);
    // if (!existing) {
    //   return res.status(404).json({ message: "Progress not found" });
    // }

    let existing = await UserProgress.getProgress(userId, moduleId);

    if (!existing) {
      // Create initial progress row for this module
      existing = await UserProgress.create({
        userId,
        moduleId,
        completedSubmodules: [],
        currentSubmoduleId: submoduleId,
        nextSubmoduleId: null
      });
    }

    // let completedSubmodules = existing.completed_submodules || [];

    // // 2️⃣ Mark current submodule completed (idempotent)
    // if (!completedSubmodules.includes(submoduleId)) {
    //   const submoduleIdNum = Number(submoduleId);

    //   completedSubmodules.push(submoduleId);
    // }

    let completedSubmodules = existing.completed_submodules || [];

    const submoduleIdNum = Number(submoduleId);
    
    if (!completedSubmodules.includes(submoduleIdNum)) {
      completedSubmodules.push(submoduleIdNum);
    }


    // 3️⃣ Get current submodule order
    const currentSubmodule = await SubModule.getSubModuleWithId(submoduleId);
    if (!currentSubmodule) {
      return res.status(404).json({ message: "Submodule not found" });
    }

    // 4️⃣ Find next submodule in SAME module
    const nextSubmodule = await SubModule.getNextByOrder(
      moduleId,
      currentSubmodule.order_index
    );

    // ─────────────────────────────
    // CASE 1: Next submodule exists
    // ─────────────────────────────
    if (nextSubmodule) {
      await UserProgress.upsertProgress({
        userId,
        moduleId,
        completedSubmodules,
        currentSubmoduleId: nextSubmodule.id,
        nextSubmoduleId: null // optional, can be derived later
      });

      return res.status(200).json({
        message: "Submodule completed",
        currentSubmoduleId: nextSubmodule.id
      });
    }

    // ─────────────────────────────
    // CASE 2: Module completed
    // ─────────────────────────────

    // 5️⃣ Finish current module row
    await UserProgress.upsertProgress({
      userId,
      moduleId,
      completedSubmodules,
      currentSubmoduleId: null,
      nextSubmoduleId: null
    });

    // 6️⃣ Find next module by order_index
    const currentModule = await Modules.getModuleById(moduleId);
    const nextModule = await Modules.getNextByOrder(
      currentModule.order_index
    );

    // No next module → course completed
    if (!nextModule) {
      return res.status(200).json({
        message: "Course completed"
      });
    }

    // 7️⃣ First submodule of next module
    const firstSubmodule = await SubModule.getFirstByOrder(
      nextModule.module_id
    );

    if (!firstSubmodule) {
      return res.status(200).json({
        message: "Next module has no submodules"
      });
    }

    // // 8️⃣ INSERT NEW ROW for next module (IMPORTANT)
    // await UserProgress.create({
    //   userId,
    //   moduleId: nextModule.id,
    //   completedSubmodules: [],
    //   currentSubmoduleId: firstSubmodule.id,
    //   nextSubmoduleId: null
    // });

    return res.status(200).json({
      message: "Moved to next module",
      moduleId: nextModule.id,
      currentSubmoduleId: firstSubmodule.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  completeSubmodule
};