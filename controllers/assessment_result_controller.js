const { AssessmentResult } = require("../models/assessment_result");

// const createNewAssementResult = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { assessmentId, moduleId, score, duration } = req.body;

//         if (
//             userId == null ||
//             assessmentId == null ||
//             moduleId == null ||
//             score == null ||
//             duration == null
//         ) {
//             return res.status(400).json({ message: "Invalid payload" });
//         }

//         await AssessmentResult.createFirstAttempt({
//             userId,
//             assessmentId,
//             moduleId,
//             score,
//             duration
//         });

//         res.status(201).json({
//             message: "Assessment result created successfully"
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             message: "Failed to create assessment result"
//         });
//     }
// }


// const updateAssessmentResult = async (req, res) => {
//     try {
//         const userId = req.user.id; // from auth middleware
//         const { assessmentId, moduleId, score, duration } = req.body;

//         if (
//             assessmentId == null ||
//             moduleId == null ||
//             score == null ||
//             duration == null
//         ) {
//             return res.status(400).json({
//                 message: "Invalid request payload"
//             });
//         }

//         const result = await AssessmentResult.submitAttempt({
//             userId,
//             assessmentId,
//             moduleId,
//             score,
//             duration
//         });

//         return res.status(200).json({
//             message: "Assessment submitted successfully",
//             attemptNo: result.attemptNo,
//             status: result.status
//         });

//     } catch (err) {
//         console.error("Assessment submit error:", err.message);

//         if (err.message === "ASSESSMENT_ALREADY_PASSED") {
//             return res.status(403).json({
//                 message: "Assessment already passed. Retake not allowed."
//             });
//         }

//         return res.status(500).json({
//             message: "Failed to submit assessment"
//         });
//     }
// }

const submitAssessmentResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const { assessmentId, moduleId, score, duration } = req.body;

        if (
            assessmentId == null ||
            moduleId == null ||
            score == null ||
            duration == null
        ) {
            return res.status(400).json({
                message: "Invalid request payload"
            });
        }

        const result = await AssessmentResult.submitAttempt({
            userId,
            assessmentId,
            moduleId,
            score,
            duration
        });

        return res.status(200).json({
            message: "Assessment submitted successfully",
            attemptNo: result.attemptNo,
            status: result.status
        });

    } catch (err) {
        console.error("Assessment submit error:", err.message);

        if (err.message === "ASSESSMENT_ALREADY_PASSED") {
            return res.status(403).json({
                message: "Assessment already passed. Retake not allowed."
            });
        }

        return res.status(500).json({
            message: "Failed to submit assessment"
        });
    }
};

/**
   * GET /assessment-result/my-modules
   * Dropdown modules for logged-in user
   */
async function getMyModules(req, res) {
    try {
        const userId = req.user.id;
        const modules = await AssessmentResult.getModulesByUser(userId);
        res.json(modules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch modules" });
    }
}

/**
 * GET /assessment-result/my-progress?moduleId=1
 * Fetch assessment results by module
 */
async function getMyProgressByModule(req, res) {
    try {
        const userId = req.user.id;
        const { moduleId } = req.query;

        if (!moduleId) {
            return res.status(400).json({ message: "moduleId is required" });
        }

        const results =
            await AssessmentResult.getResultsByUserAndModule(
                userId,
                moduleId
            );

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch progress" });
    }
}


module.exports = {
    submitAssessmentResult,
    getMyModules,
    getMyProgressByModule
}