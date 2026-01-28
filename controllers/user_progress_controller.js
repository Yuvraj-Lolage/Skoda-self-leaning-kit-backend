const { UserProgress } = require("../models/user_progress");

const completeSubmodule = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { moduleId, submoduleId, nextSubmoduleId } = req.body;

    if (!moduleId || !submoduleId) {
      return res.status(400).json({ message: "Missing data" });
    }

    // 1️⃣ Fetch existing progress (if any)
    const existing = await UserProgress.getProgress(userId, moduleId);

    let completedSubmodules = [];

    if (existing?.completed_submodules) {
      completedSubmodules = existing.completed_submodules;
    }

    // 2️⃣ Avoid duplicates
    if (!completedSubmodules.includes(submoduleId)) {
      completedSubmodules.push(submoduleId);
    }

    // 3️⃣ UPSERT
    await UserProgress.upsertProgress({
      userId,
      moduleId,
      completedSubmodules,
      currentSubmoduleId: submoduleId,
      nextSubmoduleId
    });

    return res.status(200).json({
      message: "Submodule marked as completed"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  completeSubmodule
};