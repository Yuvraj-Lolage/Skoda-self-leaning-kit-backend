const { Modules } = require("../models/modules")
const path = require("path");
const { SubModule } = require("../models/sub_module");
const fs = require("fs");
const { log } = require("console");
const getSubModuleWithId = async (req, res) => {
  const id = req.params.id;
  try {
    const submodule = await SubModule.getSubModuleWithId(id);
    if (!submodule) {
      res.status(404).json({ message: "Submodule not found" });
    }
    res.json(submodule);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

const getSubModuleFromModuleById = async (req, res) => {
  const { moduleId, submoduleId } = req.params;
  try {
    const submodule = await SubModule.getSubModuleInModuleWithId(moduleId, submoduleId);
    if (!submodule) {
      res.status(404).json({ message: "Submodule not found" });
    }
    res.json(submodule);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

const getSubmodulesInModule = async (req, res) => {
  const module_id = req.params.moduleId;
  try {
    const submodules = await SubModule.getSubMoudulesInModule(module_id);
    if (!submodules) {
      res.status(404).json({ message: "No submodules found" });
    }
    res.json(submodules);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}


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


const shiftSubmoduleFolders = async (moduleOrder, fromIndex) => {
  const SHARED_BASE_PATH = process.env.SHARED_FOLDER;

  // Path to the module directory
  const modulePath = path.join(
    SHARED_BASE_PATH,
    `module_${moduleOrder}`
  )

  if (!fs.existsSync(modulePath)) {
    return;
  }

  const folders = fs.readdirSync(modulePath);

  const submoduleFolders = folders.filter(f => /^submodule_\d+$/.test(f));

  const folderNumbers = submoduleFolders
    .map(f => parseInt(f.split("_")[1], 10))
    .filter(num => num >= fromIndex)
    .sort((a, b) => b - a);

  folderNumbers.forEach(num => {
    const oldPath = path.join(modulePath, `submodule_${num}`);
    const newPath = path.join(modulePath, `submodule_${num + 1}`);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
  })
}





const createSubModule = async (req, res) => {
  const SHARED_BASE_PATH = process.env.SHARED_FOLDER;

  try {
    const {
      module_id,
      submodule_name,
      submodule_description,
      order_index
    } = req.body;

    const fileType = req.headers["x-file-type"];

    if (!fileType) {
      return res.status(400).json({ message: "fileType header is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    // 1️⃣ Get module
    const module = await Modules.getModuleById(module_id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleOrder = module.order_index;

    // 2️⃣ Get max submodule order (DB source of truth)
    const maxOrderRaw = await SubModule.getMaxOrderIndex(module_id);
    const maxOrder = Number.isInteger(maxOrderRaw) ? maxOrderRaw : 0;

    if (order_index < 1 || order_index > maxOrder + 1) {
      return res.status(400).json({
        message: `order_index must be between 1 and ${maxOrder + 1}`
      });
    }

    const modulePath = path.join(
      SHARED_BASE_PATH,
      `module_${moduleOrder}`
    );

    if (!fs.existsSync(modulePath)) {
      fs.mkdirSync(modulePath, { recursive: true });
    }

    /**
     * ======================= ADD AT END ==========================
     * Includes:
     * - empty module
     * - order_index === maxOrder + 1
     */
    if (order_index === maxOrder + 1) {
      const finalDir = path.join(
        modulePath,
        `submodule_${order_index}`,
        fileType
      );

      fs.mkdirSync(finalDir, { recursive: true });

      const finalPath = path.join(finalDir, req.file.filename);
      await fs.promises.rename(req.file.path, finalPath);

      const filePathForDB =
        `http://localhost:3000/module_${moduleOrder}/submodule_${order_index}/${fileType}/${req.file.filename}`;

      const submodule = await SubModule.createSubModule({
        module_id,
        submodule_name,
        submodule_description,
        file_type: fileType,
        order_index,
        duration: 0,
        video_path: filePathForDB
      });

      return res.status(201).json({
        message: "Submodule created at end",
        data: submodule
      });
    }

    /**
     * ===================== INSERT IN BETWEEN =====================
     * Only shift when submodules already exist AND insertion is not at end
     */

    if (maxOrder > 0 && order_index <= maxOrder) {
      // 1 Shift folders FIRST
      await shiftSubmoduleFolders(
        moduleOrder,
        order_index
      );

      // 2 shift contents url in DB
      await SubModule.shiftSubmoduleContentUrls(module_id, order_index);

      // 3 Shift DB order indexes
      await SubModule.shiftSubmoduleOrders(module_id,order_index);
    }

    // 5️⃣ Create target folder
    const finalDir = path.join(
      modulePath,
      `submodule_${order_index}`,
      fileType
    );

    fs.mkdirSync(finalDir, { recursive: true });

    // // 6️⃣ Move file temp → final
    const finalPath = path.join(finalDir, req.file.filename);
    await fs.promises.rename(req.file.path, finalPath);

    const filePathForDB =
      `http://localhost:3000/module_${moduleOrder}/submodule_${order_index}/${fileType}/${req.file.filename}`;

    // // 7️⃣ Insert DB record
    const submodule = await SubModule.createSubModule({
      module_id,
      submodule_name,
      submodule_description,
      file_type: fileType,
      order_index,
      duration: 0,
      video_path: filePathForDB
    });

    return res.status(201).json({
      message: "Submodule inserted successfully",
      // data: submodule
    });

  } catch (error) {
    console.error("Create submodule error:", error);

    // Cleanup temp file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};







module.exports = {
  getSubModuleWithId,
  getSubModuleFromModuleById,
  getSubmodulesInModule,
  createSubModule
}