const { Assessment } = require("../models/Assignment");

const getAssessmentByModuleAndSubmodule = async (req, res) => {
    const { moduleId } = req.params;

    try {
        const assignments = await Assessment.getAssessmentsByModule(moduleId);
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error in getAssessmentByModuleAndSubmodule controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAssessmentById = async (req, res) => {
    const { assessmentId } = req.params;        
    try {
        const assignments = await Assessment.getAssessmentById(assessmentId);``
        res.status(200).json( assignments);
    } catch (error) {
        console.error("Error in getAssessmentById controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getAssessmentByModuleAndSubmodule,
    getAssessmentById
}