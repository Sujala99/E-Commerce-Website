const express = require("express");
const https = require("https");
const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

dotenv.config();

const app = express();

// Import Routes
const authRouter = require("./routes/auth");
const categoryRouter = require("./routes/categories");
const productRouter = require("./routes/products");
const brainTreeRouter = require("./routes/braintree");
const orderRouter = require("./routes/orders");
const usersRouter = require("./routes/users");
const customizeRouter = require("./routes/customize");
const { loginCheck } = require("./middleware/auth");
const CreateAllFolder = require("./config/uploadFolderCreateScript");

CreateAllFolder();

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() =>
    console.log("============== MongoDB Connected Successfully ==============")
  )
  .catch((err) => console.log("Database connection failed:", err));

// CORS configuration
const corsOptions = {
  origin: "https://localhost:3000", // Your frontend URL
  credentials: true, // Allow credentials (cookies, sessions)
};
app.use(cors(corsOptions));

// Session Management Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secure_session_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, 
    }),
    cookie: {
      secure: true, 
      httpOnly: true,
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  })
);

// General Middleware
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



const helmet = require("helmet");

app.use(helmet());

// Routes
app.use("/api", authRouter);
app.use("/api/user", usersRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
app.use("/api", brainTreeRouter);
app.use("/api/order", orderRouter);
app.use("/api/customize", customizeRouter);

// HTTPS Certificate Options
const sslOptions = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

// Start HTTPS server
const PORT = process.env.PORT || 8000;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});
