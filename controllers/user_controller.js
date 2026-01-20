const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { authenticationMiddleware, generateToken } = require('../middlewares/jwt')

const userSignUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.create(name, email, password);
        return res.status(201).json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findByEmail(email);

        if (existingUser != null) {
            if (existingUser.password != password) {
                return res.status(401).json({ message: "Invalid email or password" });
            } else {
                const payload = {
                    id: existingUser.id,
                    name: existingUser.name,
                    email: existingUser.email,
                    role: existingUser.role,
                    first_visit_welcome: existingUser.first_visit_welcome,
                    first_visit_driver: existingUser.first_visit_driver
                };

                const token = generateToken(payload);
                return res.status(200).json(token);
            }
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateWelcomeVisit = async (req, res) => {
    try{
        await User.markWelcomeVisited(req.user.id);
        return res.status(200).json({ message: "Welcome visit updated successfully" });
    }catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getUserById = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (user) {
            return res.status(200).json(user);
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


// Add this to your controller file
const updateXP = async (req, res) => {
    try {
        const { xpEarned } = req.body;
        // The id comes from your authenticationMiddleware which decodes the JWT
        const userId = req.user.id;

        if (xpEarned === undefined) {
            return res.status(400).json({ message: "XP points are required" });
        }

        await User.updateXP(userId, xpEarned);
        return res.status(200).json({ message: "XP updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Update your module exports at the bottom
module.exports = { userSignUp, userLogin, updateXP, getUserById, updateWelcomeVisit };


