const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { body, validationResult, query } = require("express-validator")
const Task = require("../models/Task.model")
const User = require("../models/User.model")
const { authenticateToken, requireAdmin, checkResourceAccess } = require("../middleware/auth")

const router = express.Router()


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/tasks"
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  
  if (file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    cb(new Error("Only PDF files are allowed"), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 3, 
  },
})


router.get(
  "/",
  authenticateToken,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("status").optional().isIn(["pending", "in-progress", "completed", "cancelled"]).withMessage("Invalid status"),
    query("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
    query("assignedTo").optional().isMongoId().withMessage("Invalid user ID"),
    query("search").optional().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
    query("sortBy")
      .optional()
      .isIn(["title", "status", "priority", "dueDate", "createdAt"])
      .withMessage("Invalid sort field"),
    query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
    query("dueDateFrom").optional().isISO8601().withMessage("Invalid due date from"),
    query("dueDateTo").optional().isISO8601().withMessage("Invalid due date to"),
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
      const {
        status,
        priority,
        assignedTo,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
        dueDateFrom,
        dueDateTo,
      } = req.query

      
      const filter = {}

      
      if (req.user.role !== "admin") {
        filter.assignedTo = req.user._id
      } else if (assignedTo) {
        filter.assignedTo = assignedTo
      }

      if (status) filter.status = status
      if (priority) filter.priority = priority

      if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
      }

      if (dueDateFrom || dueDateTo) {
        filter.dueDate = {}
        if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom)
        if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo)
      }

      
      const sort = {}
      sort[sortBy] = sortOrder === "asc" ? 1 : -1

      const [tasks, total] = await Promise.all([
        Task.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("assignedTo", "firstName lastName email")
          .populate("createdBy", "firstName lastName email"),
        Task.countDocuments(filter),
      ])

      res.json({
        tasks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTasks: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Get tasks error:", error)
      res.status(500).json({ message: "Server error fetching tasks" })
    }
  },
)


router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    
    if (req.user.role !== "admin" && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json({ task })
  } catch (error) {
    console.error("Get task error:", error)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" })
    }
    res.status(500).json({ message: "Server error fetching task" })
  }
})


router.post(
  "/",
  authenticateToken,
  upload.array("attachments", 3),
  checkResourceAccess("assignedTo"),
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title is required and must be less than 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description is required and must be less than 1000 characters"),
    body("status").optional().isIn(["pending", "in-progress", "completed", "cancelled"]).withMessage("Invalid status"),
    body("priority").isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("assignedTo").isMongoId().withMessage("Valid assigned user ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        
        if (req.files) {
          req.files.forEach((file) => {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting file:", err)
            })
          })
        }
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { title, description, status, priority, dueDate, assignedTo } = req.body

      
      const assignedUser = await User.findById(assignedTo)
      if (!assignedUser || !assignedUser.isActive) {
        return res.status(400).json({ message: "Assigned user not found" })
      }

      
      if (new Date(dueDate) <= new Date()) {
        return res.status(400).json({ message: "Due date must be in the future" })
      }

      
      const attachments = []
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
          })
        })
      }

      const task = new Task({
        title,
        description,
        status: status || "pending",
        priority,
        dueDate: new Date(dueDate),
        assignedTo,
        createdBy: req.user._id,
        attachments,
      })

      await task.save()
      await task.populate("assignedTo", "firstName lastName email")
      await task.populate("createdBy", "firstName lastName email")

      res.status(201).json({
        message: "Task created successfully",
        task,
      })
    } catch (error) {
      console.error("Create task error:", error)
      
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err)
          })
        })
      }
      res.status(500).json({ message: "Server error creating task" })
    }
  },
)


router.put(
  "/:id",
  authenticateToken,
  upload.array("attachments", 3),
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be less than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("status").optional().isIn(["pending", "in-progress", "completed", "cancelled"]).withMessage("Invalid status"),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
    body("dueDate").optional().isISO8601().withMessage("Valid due date is required"),
    body("assignedTo").optional().isMongoId().withMessage("Valid assigned user ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        
        if (req.files) {
          req.files.forEach((file) => {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting file:", err)
            })
          })
        }
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const task = await Task.findById(req.params.id)
      if (!task) {
        return res.status(404).json({ message: "Task not found" })
      }

      
      if (req.user.role !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" })
      }

      const { title, description, status, priority, dueDate, assignedTo } = req.body
      const updateData = {}

      if (title) updateData.title = title
      if (description) updateData.description = description
      if (status) updateData.status = status
      if (priority) updateData.priority = priority

      if (dueDate) {
        if (new Date(dueDate) <= new Date()) {
          return res.status(400).json({ message: "Due date must be in the future" })
        }
        updateData.dueDate = new Date(dueDate)
      }

      if (assignedTo) {
        
        if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Only admin can reassign tasks" })
        }
        const assignedUser = await User.findById(assignedTo)
        if (!assignedUser || !assignedUser.isActive) {
          return res.status(400).json({ message: "Assigned user not found" })
        }
        updateData.assignedTo = assignedTo
      }

      
      if (req.files && req.files.length > 0) {
        const newAttachments = req.files.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        }))

        
        if (task.attachments.length + newAttachments.length > 3) {
          
          req.files.forEach((file) => {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting file:", err)
            })
          })
          return res.status(400).json({ message: "Maximum 3 attachments allowed per task" })
        }

        updateData.$push = { attachments: { $each: newAttachments } }
      }

      const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("assignedTo", "firstName lastName email")
        .populate("createdBy", "firstName lastName email")

      res.json({
        message: "Task updated successfully",
        task: updatedTask,
      })
    } catch (error) {
      console.error("Update task error:", error)
      
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err)
          })
        })
      }
      if (error.name === "CastError") {
        return res.status(400).json({ message: "Invalid task ID" })
      }
      res.status(500).json({ message: "Server error updating task" })
    }
  },
)


router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    
    if (req.user.role !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((attachment) => {
        fs.unlink(attachment.path, (err) => {
          if (err) console.error("Error deleting file:", err)
        })
      })
    }

    await Task.findByIdAndDelete(req.params.id)

    res.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" })
    }
    res.status(500).json({ message: "Server error deleting task" })
  }
})


router.get("/:id/attachments/:attachmentId", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }


    if (req.user.role !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const attachment = task.attachments.id(req.params.attachmentId)
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" })
    }

    
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: "File not found on server" })
    }

    res.setHeader("Content-Type", attachment.mimetype)
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.originalName}"`)
    res.sendFile(path.resolve(attachment.path))
  } catch (error) {
    console.error("Download attachment error:", error)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID" })
    }
    res.status(500).json({ message: "Server error downloading attachment" })
  }
})


router.delete("/:id/attachments/:attachmentId", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    
    if (req.user.role !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const attachment = task.attachments.id(req.params.attachmentId)
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" })
    }

    
    fs.unlink(attachment.path, (err) => {
      if (err) console.error("Error deleting file:", err)
    })

    
    task.attachments.pull(req.params.attachmentId)
    await task.save()

    res.json({ message: "Attachment removed successfully" })
  } catch (error) {
    console.error("Remove attachment error:", error)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID" })
    }
    res.status(500).json({ message: "Server error removing attachment" })
  }
})

module.exports = router
