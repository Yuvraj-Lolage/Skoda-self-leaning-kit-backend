const express = require('express');
const { getModulesWithSubmodules, getUserProgressWithStatus, getAllModulesWithSubmodulesWithStatus } = require('../controllers/modules_controller');
const { authenticationMiddleware } = require("../middlewares/jwt");
const ModulesRouter = express.Router();

ModulesRouter.get('/with-submodules/all', getModulesWithSubmodules),
ModulesRouter.get('/with-submodules/with-status/all', authenticationMiddleware ,getAllModulesWithSubmodulesWithStatus),

module.exports = ModulesRouter;