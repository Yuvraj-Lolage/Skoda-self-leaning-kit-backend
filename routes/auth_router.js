const express = require('express');
const AuthRouter = express.Router();
const { userSignUp, userLogin, updateXP, getUserById, updateWelcomeVisit, getToursByUserId, completeTour, getAllUsers, superAdminCreateUser } = require('../controllers/user_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');

AuthRouter.post('/signup', userSignUp);
AuthRouter.post(
  '/super-admin/create',
  authenticationMiddleware,
  superAdminCreateUser
);
AuthRouter.post('/login', userLogin);

module.exports = { AuthRouter };