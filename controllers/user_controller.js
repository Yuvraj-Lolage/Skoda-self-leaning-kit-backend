const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { authenticationMiddleware, generateToken } = require('../middlewares/jwt');
const { sendNewUserCredentials } = require('../services/email_service');

function normalizeCallerRole(role) {
    return String(role || "").toLowerCase().replace(/\s+/g, "_");
}

function canCreateUsers(callerRole) {
    const n = normalizeCallerRole(callerRole);
    return n === "admin" || n === "super_admin";
}

/** New accounts may only be User or Admin (matches app sidebar / JWT). */
function normalizeAssignableRole(role) {
    const n = String(role || "User").toLowerCase().replace(/\s+/g, "_");
    if (n === "admin") return "Admin";
    return "User";
}

const userSignUp = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "name, email and password are required"
            });
        }

        const exists = await User.userExists(email);
        if (exists) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const userId = await User.create({
            name,
            email,
            password, // ⚠️ hash later
            role
        });

        res.status(201).json({
            message: "User created successfully",
            userId
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const superAdminCreateUser = async (req, res) => {
    try {
        if (!canCreateUsers(req.user?.role)) {
            return res.status(403).json({
                message: "Only administrators can create users.",
            });
        }

        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "name, email and password are required",
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters.",
            });
        }

        const exists = await User.userExists(email);
        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const trimmedEmail = String(email).trim().toLowerCase();
        const assignedRole = normalizeAssignableRole(role);

        const userId = await User.create({
            name: String(name).trim(),
            email: trimmedEmail,
            password,
            role: assignedRole,
        });

        const mailResult = await sendNewUserCredentials({
            to: trimmedEmail,
            name: String(name).trim(),
            email: trimmedEmail,
            password,
            role: assignedRole,
        });

        let message = "User created successfully. Login details were sent by email.";
        if (mailResult.skipped) {
            message =
                "User created successfully. Configure SMTP to send welcome emails automatically.";
        } else if (!mailResult.sent) {
            message =
                "User created successfully, but the welcome email could not be sent. Share credentials manually.";
        }

        return res.status(201).json({
            message,
            userId,
            emailSent: Boolean(mailResult.sent),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


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
    try {
        await User.markWelcomeVisited(req.user.id);
        return res.status(200).json({ message: "Welcome visit updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


const getToursByUserId = async (req, res) => {
    try {
        const userId = req.user.id;

        const tours = await User.getUserToursByUserId(userId);

        if (!tours) {
            return res.status(404).json({ message: "Tours not found" });
        }

        res.json(tours);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch tours" });
    }
}


const completeTour = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tourKey } = req.body;

        if (!tourKey) {
            return res.status(400).json({ message: "tourKey is required" });
        }

        const tours = await User.getUserToursByUserId(userId);

        tours[tourKey] = 1;

        await User.updateToursByUserId(userId, tours);

        res.json({ message: "Tour marked as completed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update tour" });
    }
};

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

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        return res.status(200).json(users);
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
module.exports = {
    userSignUp,
    userLogin,
    updateXP,
    getUserById,
    updateWelcomeVisit,
    getToursByUserId,
    completeTour,
    getAllUsers,
    superAdminCreateUser,
};


