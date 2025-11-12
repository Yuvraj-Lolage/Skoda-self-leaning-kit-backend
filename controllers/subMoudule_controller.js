const { SubModule } = require("../models/sub_module");

const getSubModuleWithId = async (req, res) => {
    const id = req.params.id;
    try {
        const submodule = await SubModule.getSubModuleWithId(id);
        if(!submodule){
            res.status(404).json({message: "Submodule not found"});
        }
        res.json(submodule);
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
    }
}

module.exports = {
    getSubModuleWithId
}