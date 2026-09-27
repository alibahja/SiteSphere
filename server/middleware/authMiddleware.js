//purpose:
// Read the session cookie
// read the JWT inside it
// attach the decoded user info to req.user
// eihter call nex() (pass to the controller) or return 401
// if it never calls next() the controller woudn't run

import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables")
}
const JWT_SECRET = process.env.JWT_SECRET

export function authMiddleware(req, res, next) {
  const token = req.cookies.token; //req.cookies is populated by the cookieParser() middleware in server.js.

  if (!token) {
    return res.status(401).json({ error: "Access denied. No session token provided" }) //unauthorized: you need to authenticate
    //it fires when: the user is not logged in (no cookie). or cookie expired or user cleared cookies
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);  
    if (!decoded?.userId) {
      return res.status(401).json({ error: "Invalid session token" })
    }
    req.user = decoded; //attach user to the request. the entire decoded payload ({ userId, email, iat, exp }) becomes available 
    //on every downstream controller as req.user.
    //iat = issued at (Unix timestamp)
    //exp = expiry
    next()
  } catch {
    res.status(401).json({ error: "Session expired or invalid. Please sign in again" });
  }
}



//Incoming request to POST /api/projects
//        ↓
//projectRoutes.js: projectRouter.use(authMiddleware)
//        ↓
//authMiddleware runs:
//  1. req.cookies.token → "eyJhbGciOi..."
//  2. token exists? → yes
//  3. jwt.verify(token, JWT_SECRET):
//       - signature valid? yes
//       - not expired? yes
//       → returns { userId, email, iat, exp }
//  4. decoded.userId exists? yes
//  5. req.user = { userId, email, iat, exp }
//  6. next()
//        ↓
//createProject controller runs:
//  const project = await Project.create({
//    owner: req.user.userId,      ← uses what middleware attached
//    ...
//  })
//        ↓
//Response sent