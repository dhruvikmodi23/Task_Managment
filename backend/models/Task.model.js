const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: (value) => value > new Date(),
        message: "Due date must be in the future",
      },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must be assigned to a user"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)


taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date()
    } else if (this.status !== "completed") {
      this.completedAt = undefined
    }
  }
  next()
})


taskSchema.index({ assignedTo: 1, status: 1 })
taskSchema.index({ createdBy: 1 })
taskSchema.index({ dueDate: 1 })

module.exports = mongoose.model("Task", taskSchema)
