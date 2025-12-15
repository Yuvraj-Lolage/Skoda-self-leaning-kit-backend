const db = require("../config/db");

class Assessment{
    Assessment(){}

    static async getAssessmentsByModule(moduleId, submoduleId){
        const query = `
        SELECT *
        FROM assessments
        WHERE module_id = ?;
        `;

        try {
            const [rows] = await db.query(query, [moduleId, submoduleId]);
            return rows;
        } catch (error) {
            console.error("Error in getAssignmentByModuleAndSubmodule:", error);
            throw error;
        }   
    }
    static async getAssessmentById(assessmentId){
        const query = `
        SELECT *
        FROM assessments
        WHERE assessment_id = ?;
        `;

        try {
            const [rows] = await db.query(query, [assessmentId]);
            return rows[0];
        } catch (error) {
            console.error("Error in getAssignmentByModuleAndSubmodule:", error);
            throw error;
        }   
    }
}

module.exports = {
    Assessment
}