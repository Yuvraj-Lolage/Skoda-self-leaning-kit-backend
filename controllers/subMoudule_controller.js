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

const getSubModuleFromModuleById = async (req, res) => { 
    const { moduleId, submoduleId } = req.params;
    try {
        const submodule = await SubModule.getSubModuleInModuleWithId(moduleId, submoduleId);
        if(!submodule){
            res.status(404).json({message: "Submodule not found"});
        }
        res.json(submodule);
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
    }
}

const getSubmodulesInModule = async (req,res) => {
    const module_id = req.params.moduleId;
    try {
        const submodules = await SubModule.getSubMoudulesInModule(module_id);
        if(!submodules){
            res.status(404).json({message: "No submodules found"});
        }
        res.json(submodules);
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
    }
}

const createSubModule = async (req,res) => {
    try {
        const user_role = req.user.role;
        if(user_role !== 'Admin'){
            return res.status(403).json({message: "Forbidden. Admins only."});
        }
        else{
            const submoduleData = req.body;
        res.status(201).json({message: "Submodule Created", data: submoduleData, user:user_role});
        }
        
    } catch (error) {
        res.status(500).json({message: "Internal server error", error: error.message});
    }
}

module.exports = {
    getSubModuleWithId,
    getSubModuleFromModuleById,
    getSubmodulesInModule,
    createSubModule
}