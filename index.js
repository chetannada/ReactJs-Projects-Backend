const express = require('express')
const dotenvFlow = require('dotenv-flow')
const cors = require('cors')
const cookieParser = require('cookie-parser')

// dotenv-flow is used to manage environment variables across different environments
dotenvFlow.config()

const app = express()

const REACT_APP_URL = process.env.REACT_APP_URL
const REACT_LOCAL_URL = process.env.REACT_LOCAL_URL
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'

// CORS is configured to allow requests from the frontend url
// and to allow credentials (cookies) to be sent with requests
app.use(
  cors({
    origin: isProduction ? REACT_APP_URL : REACT_LOCAL_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// allow us to parse cookies from the request, this is needed for session management
app.use(cookieParser())

// app will serve and receive data in a JSON format
app.use(express.json())

// trust first proxy for secure cookies in production
if (isProduction) {
  app.set('trust proxy', 1)
}

// Handle routes for authentication and projects
const appRouter = require('./routes')
const { connectToMongoDB } = require('./database/connection')

// Connect to MongoDB
connectToMongoDB()
app.use('/api', appRouter)

// Only start the HTTP server if this file was run directly with `node index.js`
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  )
}

module.exports = app
