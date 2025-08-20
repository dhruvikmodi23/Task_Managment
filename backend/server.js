const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")


const authRoutes = require("./routes/auth.routes")
const userRoutes = require("./routes/users.route")
const taskRoutes = require("./routes/tasks.route")
const connectDB = require("./config/database")


dotenv.config()

const app = express()


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/uploads", express.static(path.join(__dirname, "uploads")))

connectDB()


app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/tasks", taskRoutes)


app.get("/api/health", (req, res) => {
  res.json({ message: "Task Manager API is running!", timestamp: new Date().toISOString() })
})


app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})


app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
