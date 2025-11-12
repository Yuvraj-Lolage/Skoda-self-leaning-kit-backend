const express = require('express');
const { getSubModuleWithId } = require('../controllers/subMoudule_controller');
const SubModuleRouter = express.Router();


SubModuleRouter.get('/id/:id', getSubModuleWithId)

module.exports = SubModuleRouter;