// server.js - WITH CORS FIX
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  'https://ecommerce-xm2u.vercel.app',  // Your frontend
  'http://localhost:19006',              // Expo web
  'http://localhost:8081',               // iOS simulator
  'http://localhost:8082',               // Android emulator
  'exp://*',                             // Expo app
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ==================== OTHER MIDDLEWARE ====================
app.use(express.json());

// ==================== DATABASE CONNECTION ====================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://tayyab:12345@cluster0.7ehzawj.mongodb.net/ecommerce?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("⚠️ MongoDB Warning:", err.message));

// ==================== ROUTES ====================
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "E-Commerce API",
    cors: "CORS enabled for frontend",
    frontend: "https://ecommerce-xm2u.vercel.app"
  });
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password required" 
      });
    }
    
    // For testing - create a test user if doesn't exist
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String
    }));
    
    let user = await User.findOne({ email });
    
    // Create test user if doesn't exist
    if (!user) {
      const hashedPassword = await bcrypt.hash("test123", 10);
      user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "customer"
      });
      console.log("Test user created");
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Test CORS endpoint
app.get("/test-cors", (req, res) => {
  res.json({
    success: true,
    message: "CORS test successful",
    origin: req.headers.origin || "No origin header",
    allowed: true
  });
});

// ==================== EXPORT ====================
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 CORS enabled for: https://ecommerce-xm2u.vercel.app`);
  });
}