const jwt = require("jsonwebtoken");
const jwtTokenSecret = process.env.JWT_TOKEN_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) return res.status(401).json({ message: "No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtTokenSecret);
    req.userId = decoded.userId;
    req.status = decoded.status;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized." });
  }
};
