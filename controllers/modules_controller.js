const { Modules } = require('../models/modules');
const { UserProgress } = require('../models/user_progress');
const fs = require("fs");
const path = require("path");


const getAllModules = async (req, res) => {
  try {
    const modules = await Modules.getAllModules();
    res.json(modules);
  } catch (err) {
    console.error("Error fetching modules:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


const getModulesWithSubmodules = async (req, res) => {
  try {
    const modules = await Modules.getAllModulesWithSubmodules();
    res.json(modules);
  } catch (err) {
    console.error("Error fetching modules:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllModulesWithSubmodulesWithStatusFromMYSQL = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "Valid userId is required" });
    }

    const data = await Modules.getAllModulesWithSubmodulesStatus(userId);

    return res.status(200).json({
      userId,
      modules: data
    });

  } catch (err) {
    console.error("Error fetching module status:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getAllModulesWithSubmodulesWithStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    //Fetch all modules with their submodules
    const modulesWithSubModules = (await Modules.getAllModulesWithSubmodulesRaw()) || [];

    //Fetch all modules (for names/descriptions of modules without submodules)
    const allModules = (await Modules.getAllModules()) || []; // Make sure you have this method in your Module model

    //Fetch user progress for this user
    const userProgresses = (await UserProgress.getAllByUser(userId)) || [];

    //CASE 1: If user has no progress yet — everything locked
    if (!Array.isArray(userProgresses) || userProgresses.length === 0) {
      // Group by module_id
      const allLocked = allModules.map(mod => ({
        module_id: mod.module_id || mod.id,
        module_name: mod.module_name || mod.name,
        module_description: mod.module_description || mod.description,
        submodules: (modulesWithSubModules
          .filter(row => row.module_id === mod.module_id)
          .map(row => ({
            submodule_id: row.submodule_id,
            submodule_name: row.submodule_name,
            submodule_description: row.submodule_description,
            content_type: row.content_type,
            content_url: row.content_url,
            order_index: row.order_index,
            duration: row.duration,
            created_at: row.created_at,
            status: "locked",
          }))) || [],
        status: "locked",
      }));

      return res.status(200).json(allLocked);
    }

    // Build lookup map for user progress
    const progressMap = new Map();
    userProgresses.forEach(progress => {
      let completed = progress.completed_submodules;
      if (!Array.isArray(completed)) {
        if (typeof completed === "string") {
          try {
            completed = JSON.parse(completed);
          } catch {
            completed = completed ? completed.split(",").map(s => s.trim()) : [];
          }
        } else if (completed == null) {
          completed = [];
        } else {
          completed = [completed];
        }
      }

      const completedArr = completed.map(String);
      progressMap.set(progress.module_id, {
        completed: completedArr,
        completedSet: new Set(completedArr),
        current: progress.current_submodule_id != null ? String(progress.current_submodule_id) : null,
        next: progress.next_submodule_id != null ? String(progress.next_submodule_id) : null,
      });
    });

    //Identify which module is currently active (in progress)
    const activeModuleId = [...progressMap.entries()]
      .find(([_, data]) => data.current != null)?.[0];

    //Group and assign submodule statuses
    const groupedModules = modulesWithSubModules.reduce((acc, row) => {
      let module = acc.find(m => m.module_id === row.module_id);
      if (!module) {
        module = {
          module_id: row.module_id,
          module_name: row.module_name || row.name,
          module_description: row.module_description || row.description,
          submodules: [],
        };
        acc.push(module);
      }

      if (row.submodule_id) {
        const progress = progressMap.get(row.module_id);
        const subIdStr = String(row.submodule_id);
        let status = "locked";

        if (progress) {
          if (progress.completedSet.has(subIdStr)) status = "completed";
          else if (progress.current === subIdStr) status = "in_progress";
        }

        module.submodules.push({
          submodule_id: row.submodule_id,
          submodule_name: row.name,
          submodule_description: row.submodule_description,
          content_url: row.content_url,
          content_type: row.content_type,
          order_index: row.order_index,
          duration: row.duration,
          created_at: row.created_at,
          status,
        });
      }

      return acc;
    }, []);

    // Add missing modules (no submodules)
    allModules.forEach(mod => {
      const exists = groupedModules.some(m => m.module_id === mod.module_id);
      if (!exists) {
        groupedModules.push({
          module_id: mod.module_id,
          module_name: mod.name,
          module_description: mod.description,
          submodules: [],
          status: "locked",
        });
      }
    });

    // Determine module-level status
    groupedModules.forEach(module => {
      const progress = progressMap.get(module.module_id);
      if (!progress) {
        module.status = "locked";
      } else {
        const subStatuses = module.submodules.map(s => s.status);
        if (subStatuses.every(s => s === "completed")) module.status = "completed";
        else if (subStatuses.some(s => s === "in_progress")) module.status = "in_progress";
        else module.status = "locked";
      }
    });

    // Lock all modules after the active one
    let lockNext = false;
    const finalModules = groupedModules
      .sort((a, b) => a.module_id - b.module_id)
      .map(m => {
        if (m.module_id === activeModuleId) {
          lockNext = true;
          return m;
        }
        if (lockNext && m.module_id > activeModuleId) {
          m.status = "locked";
          m.submodules.forEach(s => (s.status = "locked"));
        }
        return m;
      });

    // Return structured response
    res.status(200).json(finalModules);
  } catch (error) {
    console.error(" Error in getAllModulesWithSubmodulesWithStatus:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getModuleByIdWithSubmodulesWithStatus = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { moduleId } = req.params;

    // 1. Fetch module + submodules
    const moduleData = await Modules.getModuleWithSubmodules(moduleId);

    if (!moduleData) {
      return res.status(404).json({ message: "Module not found" });
    }

    // Base structure
    const moduleInfo = {
      module_id: moduleData.module_id,
      module_name: moduleData.module_name,
      module_description: moduleData.module_description,
      submodules: [],
      status: "locked",
    };

    // 2. Fetch user progress
    const userProgress = await UserProgress.getByUserAndModule(userId, moduleId);

    // 3. If no user progress → everything locked
    if (!userProgress) {
      moduleInfo.submodules = moduleData.submodules.map((row) => ({
        ...row,
        status: "locked",
      }));
      return res.status(200).json(moduleInfo);
    }

    // 4. Normalize completed list BEFORE mapping
    let completed = userProgress.completed_submodules;

    if (!Array.isArray(completed)) {
      try {
        completed = JSON.parse(completed);
      } catch {
        completed = completed
          ? completed.toString().split(",").map((s) => s.trim())
          : [];
      }
    }

    const completedSet = new Set(completed.map(String));
    const current = userProgress.current_submodule_id
      ? String(userProgress.current_submodule_id)
      : null;

    // 5. Assign status to submodules
    moduleInfo.submodules = moduleData.submodules.map((row) => {
      const subId = String(row.submodule_id);
      let status = "locked";

      if (completedSet.has(subId)) status = "completed";
      else if (current === subId) status = "in_progress";

      return { ...row, status };
    });

    // 6. Determine module-level status
    const statuses = moduleInfo.submodules.map((s) => s.status);

    if (statuses.every((s) => s === "completed")) {
      moduleInfo.status = "completed";
    } else if (statuses.includes("in_progress")) {
      moduleInfo.status = "in_progress";
    } else {
      moduleInfo.status = "locked";
    }

    return res.status(200).json(moduleInfo);
  } catch (error) {
    console.error("Error in getModuleWithSubmodulesWithStatus:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// const createModule = async (req, res) => {
//   try {
//     const { module_name, module_description, order_index, duration } = req.body;
//     const newModule = await Modules.createModule({ module_name, module_description, order_index, duration });
//     res.status(201).json(newModule);
//   } catch (err) {
//     console.error("Error creating module:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

function assertSharedFolderReady() {
  const basePath = process.env.SHARED_FOLDER;
  if (!basePath || !fs.existsSync(basePath)) {
    throw new Error("SHARED_FOLDER is not configured or does not exist");
  }
  return basePath;
}

/**
 * Renames module_N → module_{N+1} for N >= insertIndex (descending) so names never collide.
 * On failure after partial renames, rolls back those renames so disk matches pre-shift state.
 */
function shiftModuleFolders(insertIndex) {
  const basePath = assertSharedFolderReady();

  const folderNumbers = fs
    .readdirSync(basePath)
    .filter((f) => /^module_\d+$/.test(f))
    .map((f) => parseInt(f.split("_")[1], 10))
    .filter((num) => num >= insertIndex)
    .sort((a, b) => b - a);

  const completedNums = [];
  try {
    for (const num of folderNumbers) {
      const oldPath = path.join(basePath, `module_${num}`);
      const newPath = path.join(basePath, `module_${num + 1}`);
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        completedNums.push(num);
      }
    }
  } catch (err) {
    for (const num of [...completedNums].reverse()) {
      const from = path.join(basePath, `module_${num + 1}`);
      const to = path.join(basePath, `module_${num}`);
      try {
        if (fs.existsSync(from)) fs.renameSync(from, to);
      } catch (_) {
        /* best-effort rollback */
      }
    }
    throw err;
  }
}

/**
 * Inverse of a full shiftModuleFolders(insertIndex): module_N → module_{N-1} for N > insertIndex (ascending).
 */
function unshiftModuleFolders(insertIndex) {
  const basePath = process.env.SHARED_FOLDER;
  if (!basePath || !fs.existsSync(basePath)) return;

  const folderNumbers = fs
    .readdirSync(basePath)
    .filter((f) => /^module_\d+$/.test(f))
    .map((f) => parseInt(f.split("_")[1], 10))
    .filter((num) => num > insertIndex)
    .sort((a, b) => a - b);

  for (const num of folderNumbers) {
    const from = path.join(basePath, `module_${num}`);
    const to = path.join(basePath, `module_${num - 1}`);
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  }
}

function removeModuleFolder(orderIndex) {
  const basePath = process.env.SHARED_FOLDER;
  if (!basePath) return;
  const folderPath = path.join(basePath, `module_${orderIndex}`);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}




const createModule = async (req, res) => {
  try {
    const { module_name, module_description, order_index, duration } = req.body;

    assertSharedFolderReady();

    // Get current highest module index
    const max_order_index = await Modules.getMaxOrderIndex();

    // ========================= ADD AT END ============================
    if (max_order_index + 1 == order_index) {
      const newModule = await Modules.createModule({
        module_name,
        module_description,
        order_index,
        duration,
      });

      try {
        const folderPath = path.join(
          process.env.SHARED_FOLDER,
          `module_${order_index}`
        );
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      } catch (folderErr) {
        await Modules.deleteModuleById(newModule.module_id);
        console.error("Create module folder failed; rolled back DB row:", folderErr);
        throw folderErr;
      }

      return res.status(201).json({
        message: "Module created successfully",
        module: newModule,
      });
    }

    // ====================== INSERT IN BETWEEN ========================
    // Compensate on failure so DB order_index and module_* folders stay aligned.

    await Modules.shiftModuleOrders(order_index);

    try {
      shiftModuleFolders(order_index);
    } catch (folderShiftErr) {
      await Modules.unshiftModuleOrders(order_index);
      console.error("Folder shift failed; rolled back DB order_index:", folderShiftErr);
      throw folderShiftErr;
    }

    const newFolderPath = path.join(
      process.env.SHARED_FOLDER,
      `module_${order_index}`
    );

    try {
      fs.mkdirSync(newFolderPath, { recursive: true });
    } catch (mkdirErr) {
      unshiftModuleFolders(order_index);
      await Modules.unshiftModuleOrders(order_index);
      console.error("mkdir failed; rolled back folders + DB:", mkdirErr);
      throw mkdirErr;
    }

    try {
      const newModule = await Modules.createModule({
        module_name,
        module_description,
        order_index,
        duration,
      });

      return res.status(201).json({
        message: "Module inserted successfully",
        module: newModule,
      });
    } catch (insertErr) {
      removeModuleFolder(order_index);
      unshiftModuleFolders(order_index);
      await Modules.unshiftModuleOrders(order_index);
      console.error("INSERT failed; rolled back folder + shifts:", insertErr);
      throw insertErr;
    }
  } catch (err) {
    console.error("Error creating module:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};







module.exports = {
  getModulesWithSubmodules,
  getAllModulesWithSubmodulesWithStatus,
  getModuleByIdWithSubmodulesWithStatus,
  getAllModules,
  createModule,
  getAllModulesWithSubmodulesWithStatusFromMYSQL
}
