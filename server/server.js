// purpose: Loads environment variables (from .env)
//Imports all dependencies (libraries + your own code)
//Connects to MongoDB — before accepting any request
//Wires up middleware — code that runs on every request
//Mounts routes — where URLs map to your controllers
//Starts listening on a port

import express from "express"
import "dotenv/config"
import cors from "cors" //tells the vite frontend (localhost:5173 talk to the backend (localhost:3000)) without it the browser
//blocks the requests

import cookieParser from "cookie-parser" //parses Cookie header into req.cookies. You need this so req.cookies.token works in authMiddleware
import morgan from "morgan" //Request logger. Prints POST /api/auth/login 200 45ms to your terminal. Dev convenience only.
import { connectToDatabase } from "./config/db.js"  //connects mongoose to mongo
import authRouter from "./routes/authRoutes.js"
import projectRouter from "./routes/projectRoutes.js"

const app = express() //creates an express application. uses methods like .get(), .post() .listen()

// Connect to MongoDB before accepting requests. If a request arrives before Mongo connects it would hit User.findOne(...)
// on an unconnected Mongoose instance 
await connectToDatabase()

// CORS — safe default + multi-origin support
const origins = (process.env.ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())  //trims white space
  .filter(Boolean)   //removes empty strings

app.use(cors({ origin: origins, credentials: true })) //credentials: true is required for cookies to be sent cross-origin.
// auth is 100% cookie based.

//Middleware = functions that run in order between the request and your route handler.
app.use(express.json({ limit: "5mb" })) // reads the request's body if it is json and puts it in req.body
app.use(express.urlencoded({ extended: true, limit: "5mb" })) // same as above but for form-encoded bodies
// (Content-Type: application/x-www-form-urlencoded)

//Reads the Cookie header, parses it, and puts it on req.cookies. So a cookie named token becomes req.cookies.token. 
// Without this, authMiddleware would always see req.cookies = {} and reject every request.
app.use(cookieParser())

// Request logging in dev only. Condidtional middleware: only runs in dev
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))  //morgan("dev") prints colorized one line logs
}

// Routes
app.get("/", (_req, res) => res.send("server is live"))
app.use("/api/auth", authRouter)
app.use("/api/projects", projectRouter)

// 404 for unknown routes. Catch all middleware with no path
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" }) //JSON because the  frontend uses axios with JSON parsing.
})

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error(`[Error] ${err.message}`)
  const status = err.status || err.statusCode || 500
  const isProd = process.env.NODE_ENV === "production"
  res.status(status).json({
    //In production, if it is 500 status error, don't leak the message it might contain sensitive info
    error: status === 500 && isProd ? "Internal server error" : err.message,
  })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})