const express = require('express');
const { AssessmentResult } = require('../models/assessment_result');
const { submitAssessmentResult, getMyModules, getMyProgressByModule } = require('../controllers/assessment_result_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');
const AssessmentResultRouter = express.Router();


AssessmentResultRouter.post("/submit", authenticationMiddleware, submitAssessmentResult);
AssessmentResultRouter.get("/my-modules",authenticationMiddleware,getMyModules);
AssessmentResultRouter.get("/my-progress", authenticationMiddleware, getMyProgressByModule);

module.exports = {
    AssessmentResultRouter
};