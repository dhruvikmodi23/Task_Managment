const helmet = require("helmet")
const cors = require("cors")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss-clean")
const hpp = require("hpp")

const setupSecurity = (app) => {
  
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  )

  
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  )

  
  app.use(mongoSanitize())

  
  app.use(xss())

  
  app.use(
    hpp({
      whitelist: ["sort", "fields", "page", "limit", "status", "priority"],
    }),
  )
}

module.exports = setupSecurity
