// server.js - MongoDB + Mongoose Version (Drop-in replacement)
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());

// ==================== CORS CONFIGURATION ====================
// SINGLE CORS middleware - Remove duplicate calls
const corsOptions = {
  origin: [
    'http://localhost:8081', // React Native iOS
    'http://localhost:8082', // React Native Android
    'http://localhost:19006', // Expo web
    'exp://*', // Expo app
    '*', // Allow all for now
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// ==================== CONNECT TO MONGODB ====================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://tayyab:12345@cluster0.7ehzawj.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// ==================== SCHEMAS & MODELS ====================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  image: String,
  role: { type: String, enum: ["customer", "shopkeeper"], default: "customer" }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image_url: String,
  category: String,
  stock: Number,
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: {
    type: [{
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1,
      },
    }],
    default: [],
  },
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  total_amount: Number,
  status: { type: String, default: "Pending" },
  items: [{
    product_id: { type: mongoose.Schema.Types.ObjectId },
    product_name: String,
    price: Number,
    quantity: Number,
    image_url: String
  }],
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String
  }
}, { timestamps: { createdAt: "order_date" } });

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);

// Auto convert _id → id in all responses
[userSchema, productSchema, cartSchema, orderSchema].forEach(schema => {
  schema.set("toJSON", {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
});

// ==================== JWT MIDDLEWARE ====================
const verifyToken = (requiredRole) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) {
      console.log("JWT Verification Error:", err);
      return res.status(401).json({ message: "Invalid token" });
    }
    
    if (requiredRole && decoded.role !== requiredRole) {
      return res.status(403).json({ message: "Access denied. Not authorized." });
    }
    
    req.user = decoded;
    next();
  });
};

// ==================== ROUTES ====================

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, phone, address, role });
    
    res.status(201).json({ 
      success: true,
      message: "User registered successfully!" 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ 
      id: user.id, 
      role: user.role,
      email: user.email 
    }, "secretkey", { expiresIn: "1d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      address: user.address || "",
      phone: user.phone || "",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.post("/add-product", verifyToken("shopkeeper"), async (req, res) => {
  try {
    const { name, price, description, image_url, category, stock } = req.body;
    
    if (!name || !price || !description || !image_url || !category || !stock) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await Product.create({ 
      ...req.body, 
      seller_id: req.user.id 
    });
    
    res.status(201).json({ 
      success: true,
      message: "Product added successfully" 
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ message: "Failed to add product" });
  }
});

app.put("/update-product/:id", verifyToken("shopkeeper"), async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller_id: req.user.id 
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or not owned" });
    }

    await Product.updateOne({ _id: req.params.id }, req.body);
    
    res.json({ 
      success: true,
      message: "Product updated successfully!" 
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/delete-product/:id", verifyToken("shopkeeper"), async (req, res) => {
  try {
    const result = await Product.deleteOne({ 
      _id: req.params.id, 
      seller_id: req.user.id 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json({ 
      success: true,
      message: "Product deleted successfully!" 
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

app.post("/add-to-cart", verifyToken(), async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || !mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const prodId = new mongoose.Types.ObjectId(product_id);

    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      cart = new Cart({
        user_id: userId,
        items: [{ product_id: prodId, quantity: Number(quantity) }]
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        item => item.product_id.toString() === product_id
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += Number(quantity);
      } else {
        cart.items.push({ product_id: prodId, quantity: Number(quantity) });
      }
    }

    await cart.save();
    await cart.populate({
      path: "items.product_id",
      select: "name price image_url stock"
    });

    const cartItems = cart.items
      .filter(item => item.product_id !== null)
      .map(item => ({
        id: item._id.toString(),
        product_id: item.product_id._id.toString(),
        name: item.product_id.name || "Unknown Product",
        price: Number(item.product_id.price) || 0,
        image_url: item.product_id.image_url || "https://via.placeholder.com/150",
        quantity: item.quantity,
        stock: item.product_id.stock || 0,
      }));

    if (cart.items.length !== cartItems.length) {
      await Cart.updateOne(
        { user_id: userId },
        { $pull: { "items": { product_id: null } } }
      );
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({
      success: true,
      message: "Added to cart!",
      cart: cartItems,
      totalItems: cartItems.length,
      totalPrice
    });

  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/cart", verifyToken(), async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const cart = await Cart.findOne({ user_id: userId }).populate({
      path: "items.product_id",
      select: "name price image_url stock"
    });

    if (!cart) return res.json([]);

    const items = cart.items
      .filter(item => item.product_id !== null)
      .map(item => ({
        id: item._id.toString(),
        product_id: item.product_id._id.toString(),
        name: item.product_id.name || "Deleted Product",
        price: Number(item.product_id.price) || 0,
        image_url: item.product_id.image_url || "https://via.placeholder.com/150",
        quantity: item.quantity,
      }));

    if (cart.items.length !== items.length) {
      await Cart.updateOne(
        { user_id: userId },
        { $pull: { "items": { product_id: null } } }
      );
    }

    res.json(items);
  } catch (error) {
    console.error("Cart error:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
});

app.put("/cart/update", verifyToken(), async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (quantity < 1) {
      await Cart.updateOne(
        { user_id: userId },
        { $pull: { items: { _id: itemId } } }
      );
    } else {
      await Cart.updateOne(
        { user_id: userId, "items._id": itemId },
        { $set: { "items.$.quantity": quantity } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Cart update error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/cart/item", verifyToken(), async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    await Cart.updateOne(
      { user_id: userId },
      { $pull: { items: { _id: itemId } } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Cart item delete error:", error);
    res.status(500).json({ error: "Failed to remove" });
  }
});

app.post("/place-order", verifyToken(), async (req, res) => {
  try {
    const { total_amount, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = await Order.create({
      user_id: userId,
      total_amount,
      status: "Pending",
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
      },
      items: items.map((i) => ({
        product_id: new mongoose.Types.ObjectId(i.product_id),
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      })),
    });

    await Cart.updateOne(
      { user_id: userId },
      { $set: { items: [] } }
    );

    res.json({
      success: true,
      message: "Order placed successfully!",
      orderId: order._id.toString(),
    });

  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({ message: "Failed to place order" });
  }
});

app.get("/orders", verifyToken("shopkeeper"), async (req, res) => {
  try {
    const sellerId = req.user.id;

    const orders = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      { $match: { "product.seller_id": new mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: "$_id",
          order_id: { $first: "$_id" },
          customer_name: { $first: "$customer.name" },
          customer_phone: { $first: "$customer.phone" },
          customer_address: { $first: "$customer.address" },
          total_amount: { $first: "$total_amount" },
          status: { $first: "$status" },
          order_date: { $first: "$order_date" },
          items: {
            $push: {
              product_name: "$product.name",
              product_image: "$product.image_url",
              price: "$items.price",
              quantity: "$items.quantity"
            }
          }
        }
      },
      { $sort: { order_date: -1 } }
    ]);

    const formattedOrders = orders.map(o => ({ 
      ...o, 
      order_id: o.order_id.toString() 
    }));

    res.json(formattedOrders);

  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/order/:orderId", verifyToken(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "items.product_id",
        select: "name image_url"
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const transformedOrder = {
      id: order.id,
      customer_name: order.customer.name || "N/A",
      email: order.customer.email || "No email",
      phone: order.customer.phone || "No phone",
      address: order.customer.address || "Not provided",
      total_amount: order.total_amount || 0,
      status: order.status || "Pending",
      order_date: order.order_date || order.createdAt,
      items: order.items.map(item => ({
        id: item._id.toString(),
        product_name: item.product_id?.name || item.product_name || "Unnamed Product",
        product_image: item.product_id?.image_url || item.image_url || "",
        price: item.price || 0,
        quantity: item.quantity || 1,
        subtotal: (item.price || 0) * (item.quantity || 1)
      }))
    };

    res.json(transformedOrder);

  } catch (error) {
    console.error("GET ORDER ERROR:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

app.put("/update-order/:orderId", verifyToken(), async (req, res) => {
  try {
    const result = await Order.updateOne(
      { _id: req.params.orderId }, 
      { $set: { status: req.body.status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ 
      success: true, 
      message: `Order status updated to ${req.body.status}` 
    });
    
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
});

app.delete("/delete-order/:orderId", verifyToken(), async (req, res) => {
  try {
    const result = await Order.deleteOne({ _id: req.params.orderId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ 
      success: true, 
      message: "Order deleted successfully" 
    });
    
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

app.delete("/order-item/:orderItemId", verifyToken(), async (req, res) => {
  try {
    const result = await Order.updateOne(
      { "items._id": req.params.orderItemId },
      { $pull: { items: { _id: req.params.orderItemId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Order item not found" });
    }

    res.json({ 
      success: true, 
      message: "Item removed from order" 
    });
    
  } catch (error) {
    console.error("DELETE ORDER ITEM ERROR:", error);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

app.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

app.put("/profile/:id", async (req, res) => {
  try {
    await User.updateOne({ _id: req.params.id }, req.body);
    res.json({ 
      success: true,
      message: "Profile updated successfully!" 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ E-Commerce MongoDB Server Running...");
});

// ==================== START SERVER ====================
// For Vercel deployment
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server Live on Port ${PORT}`);
    console.log(`🌐 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  });
}