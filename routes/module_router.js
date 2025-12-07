const express = require('express');
const { getModulesWithSubmodules, getAllModulesWithSubmodulesWithStatus, getModuleByIdWithSubmodulesWithStatus } = require('../controllers/modules_controller');
const { authenticationMiddleware } = require("../middlewares/jwt");
const ModulesRouter = express.Router();

ModulesRouter.get('/with-submodules/all', getModulesWithSubmodules),
ModulesRouter.get('/with-submodules/with-status/all', authenticationMiddleware ,getAllModulesWithSubmodulesWithStatus),
ModulesRouter.get('/with-id/:moduleId/with-submodules/with-status', authenticationMiddleware , getModuleByIdWithSubmodulesWithStatus);

module.exports = ModulesRouter;