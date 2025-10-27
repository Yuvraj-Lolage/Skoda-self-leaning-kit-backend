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
                    email: existingUser.email
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


module.exports = { userSignUp, userLogin };