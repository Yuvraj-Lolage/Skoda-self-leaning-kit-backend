const express = require('express');

const { Assessment } = require('../models/Assignment');
const { authenticationMiddleware } = require('../middlewares/jwt');
const { getAssessmentByModuleAndSubmodule, getAssessmentById } = require('../controllers/assessment_controller');

const AssessmentRouter = express.Router();

// Route to get assignments by moduleId and submoduleId
AssessmentRouter.get('/by/module/:moduleId', authenticationMiddleware, getAssessmentByModuleAndSubmodule);

// Route to get assignment by assessmentId
AssessmentRouter.get('/id/:assessmentId', authenticationMiddleware, getAssessmentById);

module.exports = AssessmentRouter;