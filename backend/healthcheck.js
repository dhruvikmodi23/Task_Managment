const http = require("http")

const options = {
  host: "localhost",
  port: process.env.PORT || 5000,
  path: "/api/health",
  timeout: 2000,
  method: "GET",
  headers: {
    "User-Agent": "Node-Health-Check/1.0"
  }
}

console.log(`Starting health check for ${options.host}:${options.port}${options.path}`)

const request = http.request(options, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log(`Health check status: ${res.statusCode}`)
    console.log(`Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`)
    
    if (res.statusCode === 200) {
      console.log("Health check passed ✓")
      process.exit(0)
    } else {
      console.log("Health check failed: Non-200 status code")
      process.exit(1)
    }
  })
})

request.on("error", (err) => {
  console.log("Health check failed:", err.message)
  process.exit(1)
})

request.on("timeout", () => {
  console.log("Health check timeout - server not responding within 2 seconds")
  request.removeAllListeners('error')
  request.destroy()
  process.exit(1)
})

// Handle unexpected socket closures
request.on('socket', (socket) => {
  socket.on('timeout', () => {
    console.log("Socket timeout occurred")
    request.abort()
  })
})

request.end()