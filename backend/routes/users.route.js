const express = require("express")
const { body, validationResult, query } = require("express-validator")
const User = require("../models/User.model")
const Task = require("../models/Task.model")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()


router.get(
  "/",
  authenticateToken,
  requireAdmin,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("role").optional().isIn(["user", "admin"]).withMessage("Role must be user or admin"),
    query("search").optional().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
    query("sortBy").optional().isIn(["firstName", "lastName", "email", "createdAt"]).withMessage("Invalid sort field"),
    query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit
      const { role, search, sortBy = "createdAt", sortOrder = "desc" } = req.query

      
      const filter = { isActive: true }
      if (role) filter.role = role
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ]
      }

      
      const sort = {}
      sort[sortBy] = sortOrder === "asc" ? 1 : -1

      const [users, total] = await Promise.all([
        User.find(filter).sort(sort).skip(skip).limit(limit).select("-password"),
        User.countDocuments(filter),
      ])

      res.json({
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Get users error:", error)
      res.status(500).json({ message: "Server error fetching users" })
    }
  },
)


router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found" })
    }

    
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const stats = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    }

    taskStats.forEach((stat) => {
      stats[stat._id] = stat.count
    })

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      taskStats: stats,
    })
  } catch (error) {
    console.error("Get user error:", error)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" })
    }
    res.status(500).json({ message: "Server error fetching user" })
  }
})


router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("firstName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name is required and must be less than 50 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name is required and must be less than 50 characters"),
    body("role").isIn(["user", "admin"]).withMessage("Role must be either user or admin"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password, firstName, lastName, role } = req.body

      
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" })
      }

      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
      })

      await user.save()

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          fullName: user.fullName,
        },
      })
    } catch (error) {
      console.error("Create user error:", error)
      res.status(500).json({ message: "Server error creating user" })
    }
  },
)


router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be less than 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be less than 50 characters"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("role").optional().isIn(["user", "admin"]).withMessage("Role must be either user or admin"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { firstName, lastName, email, role, isActive } = req.body
      const updateData = {}

      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (role) updateData.role = role
      if (typeof isActive === "boolean") updateData.isActive = isActive

      if (email) {
        
        const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } })
        if (existingUser) {
          return res.status(409).json({ message: "Email is already taken" })
        }
        updateData.email = email
      }

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password")

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      res.json({
        message: "User updated successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          fullName: user.fullName,
          isActive: user.isActive,
        },
      })
    } catch (error) {
      console.error("Update user error:", error)
      if (error.name === "CastError") {
        return res.status(400).json({ message: "Invalid user ID" })
      }
      res.status(500).json({ message: "Server error updating user" })
    }
  },
)


router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" })
    }

    
    user.isActive = false
    await user.save()

    
    await Task.updateMany({ assignedTo: user._id }, { assignedTo: req.user._id })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" })
    }
    res.status(500).json({ message: "Server error deleting user" })
  }
})

module.exports = router
   