const express = require('express');
const { getSubModuleWithId, getSubModuleFromModuleById, getSubmodulesInModule, createSubModule } = require('../controllers/subMoudule_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');
const SubModuleRouter = express.Router();


SubModuleRouter.get('/id/:id', getSubModuleWithId)
SubModuleRouter.get('/by/module/:moduleId/submodule/:submoduleId', authenticationMiddleware ,getSubModuleFromModuleById)
SubModuleRouter.get('/by/module/:moduleId', authenticationMiddleware ,getSubmodulesInModule)

SubModuleRouter.post('/create', authenticationMiddleware, createSubModule)
module.exports = SubModuleRouter;