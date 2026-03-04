const express = require("express");
const { authenticationMiddleware } = require("../middlewares/jwt");
const { completeSubmodule } = require("../controllers/user_progress_controller");
const UserProgressRouter = express.Router();

UserProgressRouter.post(
  "/complete-submodule",
  authenticationMiddleware,
  completeSubmodule
);

module.exports = UserProgressRouter;