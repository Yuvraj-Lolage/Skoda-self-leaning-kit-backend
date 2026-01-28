const express = require('express');
const userRouter = express.Router();
const { userSignUp, userLogin, updateXP, getUserById, updateWelcomeVisit, getAllUsers } = require('../controllers/user_controller');
const { authenticationMiddleware } = require('../middlewares/jwt');

userRouter.post('/signup', userSignUp);
userRouter.post('/login', userLogin);
userRouter.post('/update-xp', authenticationMiddleware, updateXP); 
userRouter.get('/me', authenticationMiddleware, getUserById );
userRouter.get('/', getAllUsers);
userRouter.put('/update-welcome-visit', authenticationMiddleware, updateWelcomeVisit)

module.exports = { userRouter };