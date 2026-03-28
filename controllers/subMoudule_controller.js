const { Modules } = require("../models/modules");
const path = require("path");
const { SubModule } = require("../models/sub_module");
const fs = require("fs");

function publicStaticBaseUrl() {
  return (
    process.env.PUBLIC_STATIC_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}

const getSubModuleWithId = async (req, res) => {
  const id = req.params.id;
  try {
    const submodule = await SubModule.getSubModuleWithId(id);
    if (!submodule) {
      return res.status(404).json({ message: "Submodule not found" });
    }
    return res.json(submodule);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSubModuleFromModuleById = async (req, res) => {
  const { moduleId, submoduleId } = req.params;
  try {
    const submodule = await SubModule.getSubModuleInModuleWithId(
      moduleId,
      submoduleId
    );
    if (!submodule) {
      return res.status(404).json({ message: "Submodule not found" });
    }
    return res.json(submodule);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSubmodulesInModule = async (req, res) => {
  const module_id = req.params.moduleId;
  try {
    const submodules = await SubModule.getSubMoudulesInModule(module_id);
    if (!Array.isArray(submodules)) {
      return res.status(404).json({ message: "No submodules found" });
    }
    return res.json(submodules);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


// const shiftSubmoduleFolders = (sharedBasePath, moduleOrder, fromIndex) => {
//   const modulePath = path.join(
//     sharedBasePath,
//     `module_${moduleOrder}`
//   );

//   if (!fs.existsSync(modulePath)) return;

//   const submodules = fs.readdirSync(modulePath)
//     .filter(f => f.startsWith("submodule_"))
//     .map(f => ({
//       name: f,
//       index: Number(f.split("_")[1])
//     }))
//     .filter(f => f.index >= fromIndex)
//     .sort((a, b) => b.index - a.index); // DESCENDING

//   submodules.forEach(({ name, index }) => {
//     const oldPath = path.join(modulePath, name);
//     const newPath = path.join(modulePath, `submodule_${index + 1}`);
//     fs.renameSync(oldPath, newPath);
//   });
// };



// const createSubModule = async (req, res) => {
//   try {
//     console.log("=== RECEIVED SUBMODULE CREATE REQUEST ===");
//     console.log("BODY:", req.body);
//     console.log("FILE:", req.file);
//     console.log("Headers:", req.headers);
//     // return res.json({ ok: true });

//     const {
//       module_id,
//       submodule_name,
//       submodule_description,
//       order_index
//     } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: "Video file is required" });
//     }

//     // 1️⃣ Get module
//     const module = await Modules.getModuleById(module_id);
//     if (!module) {
//       return res.status(404).json({ message: "Module not found" });
//     }

//     const moduleOrder = module.order_index;

//     // 2️⃣ Get max submodule order
//     const maxOrder = await SubModules.getMaxOrderIndex(module_id);

//     // ❌ invalid position
//     if (order_index < 1 || order_index > maxOrder + 1) {
//       return res.status(400).json({
//         message: `order_index must be between 1 and ${maxOrder + 1}`
//       });
//     }

//     // ======================= ADD AT END ==========================
//     if (order_index == maxOrder + 1) {

//       const submodule = await SubModules.createSubModule({
//         module_id,
//         submodule_name,
//         submodule_description,
//         order_index,
//         duration: 0,
//         video_path: ""
//       });

//       const finalDir = path.join(
//         __dirname,
//         "..",
//         "uploads",
//         "modules",
//         `module_${moduleOrder}`,
//         `submodule_${order_index}`
//       );

//       fs.mkdirSync(finalDir, { recursive: true });

//       const newPath = path.join(finalDir, req.file.filename);
//       fs.renameSync(req.file.path, newPath);

//       const videoPathForDB =
//         `uploads/modules/module_${moduleOrder}/submodule_${order_index}/${req.file.filename}`;

//       await SubModules.updateVideoPath(
//         submodule.submodule_id,
//         videoPathForDB
//       );

//       return res.status(201).json({
//         message: "Submodule created at end",
//         data: { ...submodule, video_path: videoPathForDB }
//       });
//     }

//     // ===================== INSERT IN BETWEEN =====================

//     // 1️⃣ Shift DB order indexes
//     await SubModules.shiftSubModuleOrders(module_id, order_index);

//     // 2️⃣ Shift folders
//     shiftSubmoduleFolders(moduleOrder, order_index);

//     // 3️⃣ Create DB entry
//     const submodule = await SubModules.createSubModule({
//       module_id,
//       submodule_name,
//       submodule_description,
//       order_index,
//       duration: 0,
//       video_path: ""
//     });

//     // 4️⃣ Create folder for new submodule
//     const finalDir = path.join(
//       __dirname,
//       "..",
//       "uploads",
//       "modules",
//       `module_${moduleOrder}`,
//       `submodule_${order_index}`
//     );

//     fs.mkdirSync(finalDir, { recursive: true });

//     // 5️⃣ Move video
//     const newPath = path.join(finalDir, req.file.filename);
//     fs.renameSync(req.file.path, newPath);

//     const videoPathForDB =
//       `uploads/modules/module_${moduleOrder}/submodule_${order_index}/${req.file.filename}`;

//     await SubModules.updateVideoPath(
//       submodule.submodule_id,
//       videoPathForDB
//     );

//     res.status(201).json({
//       message: "Submodule inserted successfully",
//       data: { ...submodule, video_path: videoPathForDB }
//     });

//   } catch (error) {
//     console.error("Create submodule error:", error);

//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }

//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// const shiftSubmoduleFolders = async (sharedBasePath, moduleOrder, fromIndex) => {
//   const modulePath = path.join(sharedBasePath, `module_${moduleOrder}`);

//   if (!fs.existsSync(modulePath)) return;

//   const entries = await fs.promises.readdir(modulePath, { withFileTypes: true });

//   const submodules = entries
//     .filter(e => e.isDirectory() && /^submodule_\d+$/.test(e.name))
//     .map(e => ({
//       name: e.name,
//       index: Number(e.name.split("_")[1])
//     }))
//     .filter(e => e.index >= fromIndex)
//     .sort((a, b) => b.index - a.index); // DESCENDING

//   for (const { name, index } of submodules) {
//     const oldPath = path.join(modulePath, name);
//     const newPath = path.join(modulePath, `submodule_${index + 1}`);

//     if (fs.existsSync(newPath)) {
//       throw new Error(
//         `Cannot rename ${name} → submodule_${index + 1}: target already exists`
//       );
//     }

//     await fs.promises.rename(oldPath, newPath);
//   }
// };


// const shiftSubmoduleFolders = async (sharedBasePath, moduleOrder, insertIndex) => {
//   const modulePath = path.join(sharedBasePath, `module_${moduleOrder}`);

//   if (!fs.existsSync(modulePath)) return;

//   // Read all folders inside module_x
//   const folders = fs.readdirSync(modulePath);

//   // Filter only submodule folders: submodule_1, submodule_2, ...
//   const submoduleFolders = folders.filter(f => /^submodule_\d+$/.test(f));

//   // Extract numbers, filter >= insertIndex, sort DESC
//   const folderNumbers = submoduleFolders
//     .map(f => parseInt(f.split("_")[1], 10))
//     .filter(num => num >= insertIndex)
//     .sort((a, b) => b - a);

//   // Rename safely (DESC → no overwrite)
//   folderNumbers.forEach(num => {
//     const oldPath = path.join(modulePath, `submodule_${num}`);
//     const newPath = path.join(modulePath, `submodule_${num + 1}`);

//     if (fs.existsSync(oldPath)) {
//       fs.renameSync(oldPath, newPath);
//     }
//   });
// };


function assertSharedFolderReady() {
  const base = process.env.SHARED_FOLDER;
  if (!base || !fs.existsSync(base)) {
    throw new Error("SHARED_FOLDER is not configured or does not exist");
  }
  return base;
}

function shiftSubmoduleFolders(moduleOrder, fromIndex) {
  const SHARED_BASE_PATH = assertSharedFolderReady();
  const modulePath = path.join(SHARED_BASE_PATH, `module_${moduleOrder}`);

  if (!fs.existsSync(modulePath)) {
    return;
  }

  const folderNumbers = fs
    .readdirSync(modulePath)
    .filter((f) => /^submodule_\d+$/.test(f))
    .map((f) => parseInt(f.split("_")[1], 10))
    .filter((num) => num >= fromIndex)
    .sort((a, b) => b - a);

  const completedNums = [];
  try {
    for (const num of folderNumbers) {
      const oldPath = path.join(modulePath, `submodule_${num}`);
      const newPath = path.join(modulePath, `submodule_${num + 1}`);
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        completedNums.push(num);
      }
    }
  } catch (err) {
    for (const num of [...completedNums].reverse()) {
      const from = path.join(modulePath, `submodule_${num + 1}`);
      const to = path.join(modulePath, `submodule_${num}`);
      try {
        if (fs.existsSync(from)) fs.renameSync(from, to);
      } catch (_) {}
    }
    throw err;
  }
}

function unshiftSubmoduleFolders(moduleOrder, insertIndex) {
  const base = process.env.SHARED_FOLDER;
  if (!base || !fs.existsSync(base)) return;
  const modulePath = path.join(base, `module_${moduleOrder}`);
  if (!fs.existsSync(modulePath)) return;

  const folderNumbers = fs
    .readdirSync(modulePath)
    .filter((f) => /^submodule_\d+$/.test(f))
    .map((f) => parseInt(f.split("_")[1], 10))
    .filter((num) => num > insertIndex)
    .sort((a, b) => a - b);

  for (const num of folderNumbers) {
    const from = path.join(modulePath, `submodule_${num}`);
    const to = path.join(modulePath, `submodule_${num - 1}`);
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  }
}

function removeSubmoduleSlotFolder(moduleOrder, orderIndex) {
  const base = process.env.SHARED_FOLDER;
  if (!base) return;
  const folderPath = path.join(base, `module_${moduleOrder}`, `submodule_${orderIndex}`);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}





const createSubModule = async (req, res) => {
  try {
    assertSharedFolderReady();

    const module_id = parseInt(String(req.body.module_id), 10);
    const order_index = parseInt(String(req.body.order_index), 10);
    const submodule_name = String(req.body.submodule_name ?? "").trim();
    const submodule_description = String(
      req.body.submodule_description ?? ""
    ).trim();

    const fileType = req.headers["x-file-type"];

    if (!fileType) {
      return res.status(400).json({ message: "fileType header is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!submodule_name || !submodule_description) {
      return res.status(400).json({
        message: "Submodule name and description are required",
      });
    }

    if (!Number.isFinite(module_id) || !Number.isFinite(order_index)) {
      return res.status(400).json({ message: "Invalid module_id or order_index" });
    }

    const module = await Modules.getModuleById(module_id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleOrder = module.order_index;

    const maxOrderRaw = await SubModule.getMaxOrderIndex(module_id);
    const maxOrder = Number(maxOrderRaw) || 0;

    if (order_index < 1 || order_index > maxOrder + 1) {
      return res.status(400).json({
        message: `order_index must be between 1 and ${maxOrder + 1}`,
      });
    }

    const modulePath = path.join(
      process.env.SHARED_FOLDER,
      `module_${moduleOrder}`
    );

    if (!fs.existsSync(modulePath)) {
      fs.mkdirSync(modulePath, { recursive: true });
    }

    /**
     * Order for insert-in-between (keeps disk, URLs, and DB aligned):
     * 1) Rename submodule_* folders (descending)
     * 2) Bump /submodule_N/ in content_url while rows still have old order_index
     * 3) Shift order_index in DB
     * 4) mkdir, move upload, INSERT
     */

    if (order_index === maxOrder + 1) {
      const finalDir = path.join(
        modulePath,
        `submodule_${order_index}`,
        fileType
      );

      try {
        fs.mkdirSync(finalDir, { recursive: true });

        const finalPath = path.join(finalDir, req.file.filename);
        await fs.promises.rename(req.file.path, finalPath);

        const base = publicStaticBaseUrl().replace(/\/$/, "");
        const filePathForDB = `${base}/module_${moduleOrder}/submodule_${order_index}/${fileType}/${req.file.filename}`;

        const submodule = await SubModule.createSubModule({
          module_id,
          submodule_name,
          submodule_description,
          file_type: fileType,
          order_index,
          duration: 0,
          video_path: filePathForDB,
        });

        return res.status(201).json({
          message: "Submodule created at end",
          data: submodule,
        });
      } catch (err) {
        removeSubmoduleSlotFolder(moduleOrder, order_index);
        console.error("Add-at-end submodule failed:", err);
        throw err;
      }
    }

    if (maxOrder > 0 && order_index <= maxOrder) {
      try {
        shiftSubmoduleFolders(moduleOrder, order_index);
      } catch (folderErr) {
        console.error("shiftSubmoduleFolders failed:", folderErr);
        throw folderErr;
      }

      try {
        await SubModule.shiftSubmoduleContentUrls(module_id, order_index);
      } catch (urlErr) {
        unshiftSubmoduleFolders(moduleOrder, order_index);
        console.error("shiftSubmoduleContentUrls failed:", urlErr);
        throw urlErr;
      }

      try {
        await SubModule.shiftSubmoduleOrders(module_id, order_index);
      } catch (dbErr) {
        await SubModule.revertSubmoduleUrlBumps(module_id, order_index);
        unshiftSubmoduleFolders(moduleOrder, order_index);
        console.error("shiftSubmoduleOrders failed:", dbErr);
        throw dbErr;
      }
    }

    const finalDir = path.join(
      modulePath,
      `submodule_${order_index}`,
      fileType
    );

    try {
      fs.mkdirSync(finalDir, { recursive: true });

      const finalPath = path.join(finalDir, req.file.filename);
      await fs.promises.rename(req.file.path, finalPath);

      const base = publicStaticBaseUrl().replace(/\/$/, "");
      const filePathForDB = `${base}/module_${moduleOrder}/submodule_${order_index}/${fileType}/${req.file.filename}`;

      const submodule = await SubModule.createSubModule({
        module_id,
        submodule_name,
        submodule_description,
        file_type: fileType,
        order_index,
        duration: 0,
        video_path: filePathForDB,
      });

      return res.status(201).json({
        message: "Submodule inserted successfully",
        data: submodule,
      });
    } catch (tailErr) {
      removeSubmoduleSlotFolder(moduleOrder, order_index);
      await SubModule.unshiftSubmoduleOrders(module_id, order_index);
      await SubModule.revertSubmoduleUrlBumps(module_id, order_index);
      unshiftSubmoduleFolders(moduleOrder, order_index);
      console.error("Insert-between final steps failed:", tailErr);
      throw tailErr;
    }
  } catch (error) {
    console.error("Create submodule error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};







module.exports = {
  getSubModuleWithId,
  getSubModuleFromModuleById,
  getSubmodulesInModule,
  createSubModule
}