const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = require("../../config");

async function userMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "Token provided in invalid format",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    console.log("Decoded token:", decoded);

    if (decoded.userId) {
      req.userId = decoded.userId;
      next();
    } else {
      return res.status(403).json({
        msg: "User not authenticated",
      });
    }
  } catch (err) {
    res.status(403).json({
      msg: "Invalid token",
      error: err.message,
    });
  }
}

module.exports = userMiddleware;
