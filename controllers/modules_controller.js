const { Modules } = require('../models/modules');


const getModulesWithSubmodules = async (req, res) => {
  try {
    const modules = await Modules.getAllModulesWithSubmodules();
    res.json(modules);
  } catch (err) {
    console.error("Error fetching modules:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
    getModulesWithSubmodules,
}
