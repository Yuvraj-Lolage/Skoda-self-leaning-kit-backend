const express = require('express');
const userRouter = express.Router();

const { userSignUp, userLogin } = require('../controllers/user_controller')

userRouter.post('/signup', userSignUp);
userRouter.post('/login', userLogin);


module.exports = { userRouter };