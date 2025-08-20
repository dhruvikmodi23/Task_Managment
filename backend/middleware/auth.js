const jwt = require("jsonwebtoken")
const User = require("../models/User")


const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1] 

    if (!token) {
      return res.status(401).json({ message: "Access token required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await User.findById(decoded.userId).select("-password")

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token or user not found" })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }
    return res.status(403).json({ message: "Invalid token" })
  }
}


const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}


const checkResourceAccess = (resourceUserField = "assignedTo") => {
  return (req, res, next) => {
    
    if (req.user.role === "admin") {
      return next()
    }

    
    if (req.method === "POST") {
      if (req.body[resourceUserField] && req.body[resourceUserField] !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only assign tasks to yourself" })
      }
      req.body[resourceUserField] = req.user._id
      return next()
    }

    
    next()
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  checkResourceAccess,
}
