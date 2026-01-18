const express = require('express');
const userRouter = express.Router();
const { userSignUp, userLogin, updateXP } = require('../controllers/user_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');

userRouter.post('/signup', userSignUp);
userRouter.post('/login', userLogin);
userRouter.post('/update-xp', authenticationMiddleware, updateXP); // Use the controller function

module.exports = { userRouter };