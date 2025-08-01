**Luma** is a full-stack e-commerce web application built with security-first principles to provide a safe and user-friendly shopping experience. It supports user authentication, product browsing, secure checkout, and robust admin controls.

Feature

  User Registration & Login with secure session management
  Role-Based Access Control (RBAC)
  Email verification and OTP-based password reset
  Strong password policy with expiry and history tracking
  Brute-force protection with account lockout and rate limiting
  Input sanitization and validation (express-validator)
  CAPTCHA (Frontend-ready) to block bot attacks
  Secure payment gateway (Braintree Integration)
  File upload handling with filtering (Multer)
  Audit logs and activity tracking
  HTTPS with secure cookies and sessions


Tech Stack

Frontend: React.js (optional, connect via CORS)
Backend: Node.js, Express.js
Database: MongoDB + Mongoose
Security:
Bcrypt for password hashing
Session-based auth (express-session + MongoStore)
Input sanitization (express-validator)
HTTPS with certificates
Helmet.js for securing HTTP headers
Rate Limiting middleware

Other Tools:
Multer for file upload
Morgan for request logging
Nodemailer for OTP emails

