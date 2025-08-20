const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/database")






dotenv.config()

const app = express()


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))




connectDB()







const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
