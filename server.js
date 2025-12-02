// server.js - COMPLETE CORS FIX
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// ==================== CORS HANDLING ====================
// Handle OPTIONS preflight FIRST
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Regular CORS middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// ==================== MIDDLEWARE ====================
app.use(express.json());

// ==================== DATABASE ====================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://tayyab:12345@cluster0.7ehzawj.mongodb.net/ecommerce?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("⚠️ MongoDB:", err.message));

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  role: { type: String, default: "customer" }
});

const User = mongoose.model("User", userSchema);

// ==================== ROUTES ====================

// Root - ALWAYS returns JSON
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "E-Commerce API",
    endpoints: {
      "GET /": "This info",
      "POST /login": "Login with {email, password}",
      "POST /signup": "Create account",
      "GET /test": "CORS test"
    }
  });
});

// Test endpoint - ALWAYS returns JSON
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "CORS test successful",
    origin: req.headers.origin || "No origin",
    timestamp: new Date().toISOString()
  });
});

// LOGIN - With proper error handling
app.post("/login", async (req, res) => {
  try {
    console.log("Login attempt:", req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    // Create test user if doesn't exist
    if (!user) {
      console.log("Creating test user...");
      const hashedPassword = await bcrypt.hash("test123", 10);
      user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "customer"
      });
      console.log("Test user created:", user.email);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      "secretkey",
      { expiresIn: "24h" }
    );
    
    // Send success response
    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        address: user.address || ""
      }
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + error.message 
    });
  }
});

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email and password are required" 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      address: address || "",
      role: role || "customer"
    });
    
    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "secretkey",
      { expiresIn: "24h" }
    );
    
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================
// Catch 404 and ALWAYS return JSON
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found: " + req.originalUrl 
  });
});

// Global error handler - ALWAYS returns JSON
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// ==================== EXPORT ====================
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}