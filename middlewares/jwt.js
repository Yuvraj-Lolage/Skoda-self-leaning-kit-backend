const jwt = require("jsonwebtoken");
require("dotenv").config();
const AdminAuthenticationMiddleware = (req, res, next) => {
  try {
    // extract token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send("Access Denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send("Access Denied. Token missing.");
    }

    // verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // attach user info to request object
    req.user = decodedToken;

    // move to next middleware/route handler
    next();
  } catch (error) {
    console.error(error);
    return res.status(400).send("Invalid token.");
  }
};


const authenticationMiddleware = (req, res, next) => {
  try {
    // extract token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send("Access Denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send("Access Denied. Token missing.");
    }

    // verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // attach user info to request object
    req.user = decodedToken;

    // move to next middleware/route handler
    next();
  } catch (error) {
    console.error(error);
    return res.status(400).send("Invalid token.");
  }
};


const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET_KEY, {expiresIn:30000});
};

module.exports = { authenticationMiddleware, generateToken, AdminAuthenticationMiddleware };
