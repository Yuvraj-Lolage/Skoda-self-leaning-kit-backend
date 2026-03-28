const express = require("express");
const { authenticationMiddleware } = require("../middlewares/jwt");
const {
  startSubmodule,
  completeSubmodule,
  getModulesCatalog,
  getTrackProgress,
} = require("../controllers/learning_progress_controller");

const LearningProgressRouter = express.Router();

LearningProgressRouter.post(
  "/start-submodule",
  authenticationMiddleware,
  startSubmodule
);

LearningProgressRouter.post(
  "/complete-submodule",
  authenticationMiddleware,
  completeSubmodule
);

LearningProgressRouter.get(
  "/catalog",
  authenticationMiddleware,
  getModulesCatalog
);

LearningProgressRouter.get(
  "/track",
  authenticationMiddleware,
  getTrackProgress
);

module.exports = LearningProgressRouter;
