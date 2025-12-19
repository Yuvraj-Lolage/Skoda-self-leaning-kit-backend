const { SubModule } = require("../models/sub_module");

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


const shiftSubmoduleFolders = (moduleOrder, fromIndex) => {
  const modulePath = path.join(
    __dirname,
    "..",
    "uploads",
    "modules",
    `module_${moduleOrder}`
  );

  if (!fs.existsSync(modulePath)) return;

  const submodules = fs.readdirSync(modulePath)
    .filter(f => f.startsWith("submodule_"))
    .map(f => ({
      name: f,
      index: Number(f.split("_")[1])
    }))
    .filter(f => f.index >= fromIndex)
    .sort((a, b) => b.index - a.index); // DESCENDING

  submodules.forEach(({ name, index }) => {
    const oldPath = path.join(modulePath, name);
    const newPath = path.join(
      modulePath,
      `submodule_${index + 1}`
    );
    fs.renameSync(oldPath, newPath);
  });
};


const createSubModule = async (req, res) => {
  try {
    const {
      module_id,
      submodule_name,
      submodule_description,
      order_index
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    // 1️⃣ Get module
    const module = await Modules.getModuleById(module_id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleOrder = module.order_index;

    // 2️⃣ Get max submodule order
    const maxOrder = await SubModules.getMaxOrderIndex(module_id);

    // ❌ invalid position
    if (order_index < 1 || order_index > maxOrder + 1) {
      return res.status(400).json({
        message: `order_index must be between 1 and ${maxOrder + 1}`
      });
    }

    // ======================= ADD AT END ==========================
    if (order_index == maxOrder + 1) {

      const submodule = await SubModules.createSubModule({
        module_id,
        submodule_name,
        submodule_description,
        order_index,
        duration: 0,
        video_path: ""
      });

      const finalDir = path.join(
        __dirname,
        "..",
        "uploads",
        "modules",
        `module_${moduleOrder}`,
        `submodule_${order_index}`
      );

      fs.mkdirSync(finalDir, { recursive: true });

      const newPath = path.join(finalDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);

      const videoPathForDB =
        `uploads/modules/module_${moduleOrder}/submodule_${order_index}/${req.file.filename}`;

      await SubModules.updateVideoPath(
        submodule.submodule_id,
        videoPathForDB
      );

      return res.status(201).json({
        message: "Submodule created at end",
        data: { ...submodule, video_path: videoPathForDB }
      });
    }

    // ===================== INSERT IN BETWEEN =====================

    // 1️⃣ Shift DB order indexes
    await SubModules.shiftSubModuleOrders(module_id, order_index);

    // 2️⃣ Shift folders
    shiftSubmoduleFolders(moduleOrder, order_index);

    // 3️⃣ Create DB entry
    const submodule = await SubModules.createSubModule({
      module_id,
      submodule_name,
      submodule_description,
      order_index,
      duration: 0,
      video_path: ""
    });

    // 4️⃣ Create folder for new submodule
    const finalDir = path.join(
      __dirname,
      "..",
      "uploads",
      "modules",
      `module_${moduleOrder}`,
      `submodule_${order_index}`
    );

    fs.mkdirSync(finalDir, { recursive: true });

    // 5️⃣ Move video
    const newPath = path.join(finalDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);

    const videoPathForDB =
      `uploads/modules/module_${moduleOrder}/submodule_${order_index}/${req.file.filename}`;

    await SubModules.updateVideoPath(
      submodule.submodule_id,
      videoPathForDB
    );

    res.status(201).json({
      message: "Submodule inserted successfully",
      data: { ...submodule, video_path: videoPathForDB }
    });

  } catch (error) {
    console.error("Create submodule error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
    getSubModuleWithId,
    getSubModuleFromModuleById,
    getSubmodulesInModule,
    createSubModule
}