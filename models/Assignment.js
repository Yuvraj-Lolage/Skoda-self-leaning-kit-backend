const db = require("../config/db");

class Assessment{
    Assessment(){}

    static async getAssessmentsByModule(moduleId){
        const query = `
        SELECT *
        FROM assessments
        WHERE module_id = ?
        ORDER BY submodule_id ASC, assessment_id ASC;
        `;

        try {
            const [rows] = await db.query(query, [moduleId]);
            return rows;
        } catch (error) {
            console.error("Error in getAssignmentByModuleAndSubmodule:", error);
            throw error;
        }   
    }

    /** Catalog / progress: no questions JSON payload */
    static async getAssessmentSummariesByModule(moduleId) {
        const query = `
        SELECT assessment_id, module_id, submodule_id, title, description, created_at
        FROM assessments
        WHERE module_id = ?
        ORDER BY submodule_id ASC, assessment_id ASC
        `;
        const [rows] = await db.query(query, [moduleId]);
        return rows;
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