const express = require('express');
const { getModulesWithSubmodules, getAllModulesWithSubmodulesWithStatus, getModuleByIdWithSubmodulesWithStatus, getAllModules, createModule, getAllModulesWithSubmodulesWithStatusFromMYSQL } = require('../controllers/modules_controller');
const { authenticationMiddleware } = require("../middlewares/jwt");
const ModulesRouter = express.Router();

ModulesRouter.get('/all', authenticationMiddleware ,getAllModules),
ModulesRouter.get('/with-submodules/all', getModulesWithSubmodules),
ModulesRouter.get('/with-submodules/with-status/all', authenticationMiddleware , getAllModulesWithSubmodulesWithStatusFromMYSQL),
ModulesRouter.get('/with-id/:moduleId/with-submodules/with-status', authenticationMiddleware , getModuleByIdWithSubmodulesWithStatus);


ModulesRouter.post('/create', authenticationMiddleware, createModule);
module.exports = ModulesRouter;