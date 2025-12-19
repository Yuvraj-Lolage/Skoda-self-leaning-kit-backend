const express = require('express');
const { getSubModuleWithId, getSubModuleFromModuleById, getSubmodulesInModule, createSubModule } = require('../controllers/subMoudule_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');
const upload = require("../middlewares/upload_submodule");
const SubModuleRouter = express.Router();


SubModuleRouter.get('/id/:id', getSubModuleWithId)
SubModuleRouter.get('/by/module/:moduleId/submodule/:submoduleId', authenticationMiddleware ,getSubModuleFromModuleById)
SubModuleRouter.get('/by/module/:moduleId', authenticationMiddleware ,getSubmodulesInModule)

// SubModuleRouter.post(
//   "/create",
//   authenticationMiddleware,
//   upload.single("file"), // MUST match frontend key
//   createSubModule
// );

SubModuleRouter.post(
  "/create",
  upload.single("file"),
  (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    res.json({ ok: true });
  }
);

module.exports = SubModuleRouter;