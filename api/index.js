// api/index.js — E-COMMERCE BACKEND (Your App) — FULLY VERCEL READY + VOGUEVAULT STYLE
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// CORS — Allow React Native (Expo Go + Web + Mobile)
app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://localhost:3000",
      "http://192.168.1.101:8081",
      "exp://*",
      "https://ecommerce-sage-kappa-45.vercel.app",
      "https://your-app.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json({ limit: "10mb" }));

// ==================== MongoDB Connection (Serverless Safe) ====================
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log("Connected to MongoDB → E-Commerce App");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    throw err;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// ==================== Schemas & Models ====================
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true },
    password: String,
    phone: String,
    address: String,
    image: String,
    role: { type: String, enum: ["customer", "shopkeeper"], default: "customer" },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    image_url: String,
    category: String,
    stock: Number,
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, default: 1, min: 1 },
    },
  ],
});

const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    total_amount: Number,
    status: { type: String, default: "Pending" },
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId },
        product_name: String,
        price: Number,
        quantity: Number,
        image_url: String,
      },
    ],
    customer: { name: String, email: String, phone: String, address: String },
  },
  { timestamps: { createdAt: "order_date" } }
);

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);

// Auto convert _id → id + remove __v
[userSchema, productSchema, cartSchema, orderSchema].forEach((schema) => {
  schema.set("toJSON", {
    transform: (doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
});

// ==================== JWT Auth Middleware ====================
const authMiddleware = (requiredRole) => async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    req.user = { id: user.id, role: user.role, name: user.name };
    next();
  } catch (err) {
    console.error("Token error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ==================== ROUTES ====================

app.get("/", (req, res) => {
  res.json({ message: "E-Commerce API is LIVE & READY!" });
});

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, address, role = "customer" } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Required fields missing" });

    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone, address, role });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });

    console.log("New user registered:", email, "→", role);
    res.status(201).json({
      message: "Registered successfully",
      token,
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log("Login failed: Invalid credentials →", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });

    console.log("Login successful →", email, "(", user.role, ")");
    res.json({
      message: "Login successful",
      token,
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    console.log(`Fetched ${products.length} products`);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.post("/add-product", authMiddleware("shopkeeper"), async (req, res) => {
  try {
    const { name, price, description, image_url, category, stock } = req.body;
    if (!name || !price || !image_url || !category || !stock) return res.status(400).json({ message: "All fields required" });

    await Product.create({ ...req.body, seller_id: req.user.id });
    console.log("Product added by", req.user.name);
    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add product" });
  }
});

app.put("/update-product/:id", authMiddleware("shopkeeper"), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller_id: req.user.id });
    if (!product) return res.status(404).json({ message: "Product not found or not owned" });
    await Product.updateOne({ _id: req.params.id }, req.body);
    console.log("Product updated:", req.params.id);
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/delete-product/:id", authMiddleware("shopkeeper"), async (req, res) => {
  try {
    const result = await Product.deleteOne({ _id: req.params.id, seller_id: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Product not found" });
    console.log("Product deleted:", req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// CART ROUTES
app.post("/add-to-cart", authMiddleware(), async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id || !mongoose.Types.ObjectId.isValid(product_id)) return res.status(400).json({ message: "Invalid product ID" });

  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const prodId = new mongoose.Types.ObjectId(product_id);
    const product = await Product.findById(prodId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [{ product_id: prodId, quantity }] });
    } else {
      const idx = cart.items.findIndex(i => i.product_id.toString() === product_id);
      if (idx > -1) cart.items[idx].quantity += quantity;
      else cart.items.push({ product_id: prodId, quantity });
    }

    await cart.save();
    await cart.populate("items.product_id", "name price image_url stock");

    const items = cart.items
      .filter(i => i.product_id)
      .map(i => ({
        id: i._id.toString(),
        product_id: i.product_id._id.toString(),
        name: i.product_id.name,
        price: i.product_id.price,
        image_url: i.product_id.image_url,
        quantity: i.quantity,
        stock: i.product_id.stock,
      }));

    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    console.log(`Added to cart → User: ${req.user.name}, Product: ${product.name}`);
    res.json({ success: true, message: "Added to cart!", cart: items, totalItems: items.length, totalPrice });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/cart", authMiddleware(), async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user.id }).populate("items.product_id", "name price image_url stock");
    if (!cart || cart.items.length === 0) return res.json([]);

    const items = cart.items
      .filter(i => i.product_id)
      .map(i => ({
        id: i._id.toString(),
        product_id: i.product_id._id.toString(),
        name: i.product_id.name,
        price: i.product_id.price,
        image_url: i.product_id.image_url,
        quantity: i.quantity,
      }));

    res.json(items);
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

app.put("/cart/update", authMiddleware(), async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (quantity < 1) {
      await Cart.updateOne({ user_id: userId }, { $pull: { items: { _id: itemId } } });
    } else {
      await Cart.updateOne({ user_id: userId, "items._id": itemId }, { $set: { "items.$.quantity": quantity } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/cart/item", authMiddleware(), async (req, res) => {
  try {
    const { itemId } = req.body;
    await Cart.updateOne({ user_id: req.user.id }, { $pull: { items: { _id: itemId } } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Remove failed" });
  }
});

// PLACE ORDER
app.post("/place-order", authMiddleware(), async (req, res) => {
  try {
    const { total_amount, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = await Order.create({
      user_id: req.user.id,
      total_amount,
      customer: { name: user.name, email: user.email, phone: user.phone || "", address: user.address || "" },
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      })),
    });

    await Cart.updateOne({ user_id: req.user.id }, { $set: { items: [] } });
    console.log("Order placed → ID:", order.id, "by", user.name);

    res.json({ success: true, message: "Order placed!", orderId: order.id });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ message: "Order failed" });
  }
});

// SHOPKEEPER: All Orders
app.get("/orders", authMiddleware("shopkeeper"), async (req, res) => {
  try {
    const orders = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: { from: "products", localField: "items.product_id", foreignField: "_id", as: "product" }
      },
      { $unwind: "$product" },
      { $match: { "product.seller_id": new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: "$_id",
          order_id: { $first: "$_id" },
          customer_name: { $first: "$customer.name" },
          total_amount: { $first: "$total_amount" },
          status: { $first: "$status" },
          order_date: { $first: "$order_date" },
          items: {
            $push: {
              product_name: "$product.name",
              product_image: "$product.image_url",
              price: "$items.price",
              quantity: "$items.quantity",
            },
          },
        },
      },
      { $sort: { order_date: -1 } },
    ]);

    res.json(orders.map(o => ({ ...o, order_id: o.order_id.toString() })));
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ORDER DETAIL
app.get("/order/:orderId", authMiddleware(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("items.product_id", "name image_url");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const transformed = {
      id: order.id,
      total_amount: order.total_amount,
      status: order.status,
      order_date: order.order_date,
      customer_name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      address: order.customer.address,
      items: order.items.map(i => ({
        product_name: i.product_id?.name || i.product_name,
        product_image: i.product_id?.image_url || i.image_url,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
    };

    res.json(transformed);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// PROFILE
app.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    user ? res.json(user) : res.status(404).json({ message: "User not found" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/profile/:id", authMiddleware(), async (req, res) => {
  if (req.params.id !== req.user.id) return res.status(403).json({ message: "Access denied" });
  await User.updateOne({ _id: req.user.id }, req.body);
  res.json({ message: "Profile updated" });
});

// UPDATE ORDER STATUS
app.put("/update-order/:orderId", authMiddleware(), async (req, res) => {
  try {
    const result = await Order.updateOne({ _id: req.params.orderId }, { status: req.body.status });
    if (result.matchedCount === 0) return res.status(404).json({ message: "Order not found" });
    console.log("Order status updated →", req.params.orderId, "to", req.body.status);
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// ==================== EXPORT FOR VERCEL ====================
module.exports = app;