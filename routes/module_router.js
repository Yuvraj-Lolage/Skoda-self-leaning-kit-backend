const express = require('express');
const { getModulesWithSubmodules } = require('../controllers/modules_controller');
const ModulesRouter = express.Router();

ModulesRouter.get('/with-submodules/all', getModulesWithSubmodules)

module.exports = ModulesRouter;