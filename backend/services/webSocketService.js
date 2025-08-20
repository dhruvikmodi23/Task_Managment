const { Server } = require("socket.io")

class WebSocketService {
  constructor() {
    this.io = null
    this.connectedUsers = new Map()
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    })

    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join", (userId) => {
        this.connectedUsers.set(userId, socket.id)
        socket.join(`user_${userId}`)
        console.log(`User ${userId} joined room`)
      })

      socket.on("disconnect", () => {
        // Remove user from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId)
            break
          }
        }
        console.log("User disconnected:", socket.id)
      })
    })
  }

  // Emit task updates to specific user
  emitTaskUpdate(userId, task, action) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit("taskUpdate", {
        task,
        action, // 'created', 'updated', 'deleted', 'assigned'
        timestamp: new Date(),
      })
    }
  }

  // Emit task assignment notification
  emitTaskAssignment(userId, task) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit("taskAssigned", {
        task,
        message: `You have been assigned a new task: ${task.title}`,
        timestamp: new Date(),
      })
    }
  }

  // Broadcast system notifications
  broadcastNotification(message, type = "info") {
    if (this.io) {
      this.io.emit("systemNotification", {
        message,
        type,
        timestamp: new Date(),
      })
    }
  }
}

module.exports = new WebSocketService()
