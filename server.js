// server.js - WORKING VERSION
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(cors());

// ==================== DATABASE CONNECTION ====================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://tayyab:12345@cluster0.7ehzawj.mongodb.net/ecommerce?retryWrites=true&w=majority";

console.log("Attempting MongoDB connection...");

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
  console.log("⚠️ MongoDB Connection Warning:", err.message);
  // Don't crash - continue without DB
});

// ==================== BASIC ROUTES ====================
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "E-Commerce API is LIVE!",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    database: mongoose.connection.readyState
  });
});

// ==================== LOGIN ROUTE (Minimal) ====================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password required" 
      });
    }
    
    // Temporary response - will connect to DB later
    res.json({
      success: true,
      message: "Login endpoint working",
      token: "test-jwt-token",
      user: {
        id: "test-id",
        email: email,
        role: "customer"
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ==================== PRODUCTS ROUTE ====================
app.get("/products", (req, res) => {
  res.json({
    success: true,
    message: "Products endpoint working",
    products: []
  });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// ==================== EXPORT FOR VERCEL ====================
module.exports = app;

// ==================== LOCAL DEVELOPMENT ====================
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}