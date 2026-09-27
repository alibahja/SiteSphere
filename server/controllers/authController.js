import { User } from "../models/user.js";
import jwt from 'jsonwebtoken' // used to write tokens

if (!process.env.JWT_SECRET) {  // if secret key is missing the server won't start.
  throw new Error("JWT_SECRET must be set in environment variables")
}
const JWT_SECRET = process.env.JWT_SECRET

// called by both register and login after successful auth.
const setSessionCookie = (res, payload) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" })  // payload is the {userId,email}
  //jwt.sign encodes the payload, signs it with the secret, and returns a string. Expires in 30 days, after that
  //jwt.verify throws and the user must log in again

  // set the cookie
  res.cookie('token', token, {
    httpOnly: true,  // js cannot read this cookie via document.cookie.
    secure: process.env.NODE_ENV === "production",  // when true the browser only sends the cookie over HTTPS. In production
    // forces HTTPS only

    sameSite: "lax", //controls whether the cookie is sent on cross-site requests. "lax" is the safe modern default.
    maxAge: 30 * 24 * 60 * 1000, // Cookie lifetime in milliseconds: 30 days × 24 hours × 60 min × 60 sec × 1000 ms
    path: "/", // Cookie is sent on every request path under /It wouldn't be sent over /api for example
  })
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" })
    }
    const trimmedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: "Invalid email address" })
    }

    const existing = await User.findOne({ email: trimmedEmail })
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" })
    }

    const user = await User.create({ name, email: trimmedEmail, password }) // creates the user
    
    // set the cookie- user is now logged in without a second request
    setSessionCookie(res, { userId: user._id.toString(), email: user.email })
    res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email }
    })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "An account with this email already exists" })
    }
    console.error("Register error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" })
    }
    const isValid = await user.comparePassword(password)  
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" })
    }
    // same cookie setup for register
    setSessionCookie(res, { userId: user._id.toString(), email: user.email })
    res.status(200).json({                                  
      user: { _id: user._id, name: user.name, email: user.email }
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
//set the cookie to empty string with maxAge: 0. This tells the browser: "expire this cookie right now." The browser deletes it
// the JWT is technically valid until exp date (30 days). But since the cookie is deleted the browser won't send it. So the 
// authmiddleware will 401 on the next request.
export async function logout(_req, res) {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
  res.json({ success: true })
}


// returns the currently-logged in user's data based on the cookie.
export async function me(req, res) {
  try {
    if (!req.user?.userId) {// defensive check. If somehow the middleware let a bad token through, bail out.
      return res.status(401).json({ error: "Not authenticated" })
    }
    const user = await User.findById(req.user.userId).select("-password") // fetch the actual user from the DB
    //select("-password") execludes the password field from the result. Don't leak the hash

    if (!user) { //the JWT is valid but the user was deleted. Rare, but handled
      return res.status(404).json({ error: "User not found" })
    }
    res.json({ user })
  } catch (err) {
    console.error("Me error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}