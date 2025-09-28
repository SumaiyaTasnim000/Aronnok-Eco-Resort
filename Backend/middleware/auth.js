// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

function auth(rolesAllowed) {
  return (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (rolesAllowed) {
        if (Array.isArray(rolesAllowed)) {
          if (!rolesAllowed.includes(decoded.urole)) {
            return res
              .status(403)
              .json({ message: "Forbidden: insufficient rights" });
          }
        } else if (decoded.urole !== rolesAllowed) {
          return res
            .status(403)
            .json({ message: "Forbidden: insufficient rights" });
        }
      }

      req.user = decoded; // attach user info (uid, urole)
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
}

module.exports = auth;
