const express = require('express');
const { getSubModuleWithId, getSubModuleFromModuleById } = require('../controllers/subMoudule_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');
const SubModuleRouter = express.Router();


SubModuleRouter.get('/id/:id', getSubModuleWithId)
SubModuleRouter.get('/by/module/:moduleId/submodule/:submoduleId', authenticationMiddleware ,getSubModuleFromModuleById)

module.exports = SubModuleRouter;