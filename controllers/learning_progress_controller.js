const db = require("../config/db");
const { SubModule } = require("../models/sub_module");
const { Modules } = require("../models/modules");
const { UserSubmoduleProgress } = require("../models/user_submodule_progress");
const { UserModuleProgress } = require("../models/user_module_progress");
const { UserLearningPathProgress } = require("../models/user_learning_path_progress");
const { TrainingModulesCatalog } = require("../models/training_modules_catalog");

const DEFAULT_TRACK_ID = 1;

const startSubmodule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId, submoduleId, trackId = DEFAULT_TRACK_ID } = req.body;

    if (!moduleId || !submoduleId) {
      return res.status(400).json({ message: "moduleId and submoduleId are required" });
    }

    const modId = Number(moduleId);
    const subId = Number(submoduleId);

    const submodule = await SubModule.getSubModuleInModuleWithId(modId, subId);
    if (!submodule) {
      return res.status(404).json({ message: "Submodule not found in this module" });
    }

    await UserLearningPathProgress.ensureRow(userId, trackId);
    await UserSubmoduleProgress.upsertStart(userId, trackId, modId, subId);

    const nextSubmodule = await SubModule.getNextByOrder(modId, submodule.order_index);
    const nextId = nextSubmodule ? nextSubmodule.submodule_id : null;

    await UserModuleProgress.upsertStart(
      userId,
      trackId,
      modId,
      subId,
      nextId
    );
    await TrainingModulesCatalog.syncUserModuleProgressRow(userId, trackId, modId);
    await UserLearningPathProgress.touchInProgress(userId, trackId, modId);

    const learningPath = await UserLearningPathProgress.recalculate(userId, trackId);

    return res.status(200).json({
      message: "Submodule progress started",
      currentSubmoduleId: subId,
      nextSubmoduleId: nextId,
      learningPath,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const completeSubmodule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId, submoduleId, trackId = DEFAULT_TRACK_ID } = req.body;

    if (!moduleId || !submoduleId) {
      return res.status(400).json({ message: "Missing data" });
    }

    const modId = Number(moduleId);
    const subId = Number(submoduleId);

    const submodule = await SubModule.getSubModuleInModuleWithId(modId, subId);
    if (!submodule) {
      return res.status(404).json({ message: "Submodule not found" });
    }

    await UserLearningPathProgress.ensureRow(userId, trackId);
    await UserSubmoduleProgress.markCompleted(userId, trackId, modId, subId);

    const syncState = await TrainingModulesCatalog.syncUserModuleProgressRow(
      userId,
      trackId,
      modId
    );

    const learningPath = await UserLearningPathProgress.recalculate(userId, trackId);

    if (!syncState.moduleCompleted) {
      return res.status(200).json({
        message: "Submodule completed",
        currentSubmoduleId: syncState.currentSubmoduleId,
        nextSubmoduleId: syncState.nextSubmoduleId,
        learningPath,
        ...syncState,
      });
    }

    const currentModule = await Modules.getModuleById(modId);
    const nextModule = currentModule
      ? await Modules.getNextByOrder(currentModule.order_index)
      : null;

    if (!nextModule) {
      return res.status(200).json({
        message: "Course completed",
        learningPath,
      });
    }

    const firstSubmodule = await SubModule.getFirstByOrder(nextModule.module_id);

    return res.status(200).json({
      message: "Moved to next module",
      moduleId: nextModule.module_id,
      currentSubmoduleId: firstSubmodule ? firstSubmodule.submodule_id : null,
      learningPath,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getModulesCatalog = async (req, res) => {
  try {
    const userId = req.user.id;
    const trackId = Number(req.query.trackId) || DEFAULT_TRACK_ID;

    const catalog = await TrainingModulesCatalog.getCatalogForUser(userId, trackId);
    return res.status(200).json(catalog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTrackProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const trackId = Number(req.query.trackId) || DEFAULT_TRACK_ID;

    await UserLearningPathProgress.ensureRow(userId, trackId);
    const learningPath = await UserLearningPathProgress.recalculate(userId, trackId);

    const [modules] = await db.execute(
      `
      SELECT ump.*, m.name AS module_name, m.order_index AS module_order_index
      FROM modules m
      LEFT JOIN user_module_progress ump
        ON ump.module_id = m.module_id AND ump.user_id = ? AND ump.track_id = ?
      ORDER BY m.order_index ASC
      `,
      [userId, trackId]
    );

    return res.status(200).json({
      learningPath,
      modules,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  startSubmodule,
  completeSubmodule,
  getModulesCatalog,
  getTrackProgress,
};
