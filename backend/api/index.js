// server.js - MongoDB + Mongoose Version (Drop-in replacement)
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ==================== CONNECT TO MONGODB ====================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://tayyab:12345@cluster0.7ehzawj.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB Error:", err));
  const corsOptions = {
  origin: [
    'http://localhost:8081', // React Native iOS
    'http://localhost:8082', // React Native Android
    'http://localhost:19006', // Expo web
    'https://your-frontend.vercel.app', // Your frontend (if any)
    'exp://your-expo-app-url', // Expo app
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Update CORS to be more permissive during development
app.use(cors({
  origin: '*', // For development only
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    if (requiredRole && decoded.role !== requiredRole)
      return res.status(403).json({ message: "Access denied. Not authorized." });
    req.user = decoded;
    next();
  });
};

// ==================== ROUTES ====================

app.post("/signup", async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: "All required fields must be provided" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed, phone, address, role });
  res.status(201).json({ message: "User registered successfully!" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, "secretkey", { expiresIn: "1d" });

  res.json({
    message: "Login successful",
    token,
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    address: user.address || "",
    phone: user.phone,
  });
});

app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/add-product", verifyToken("shopkeeper"), async (req, res) => {
  const { name, price, description, image_url, category, stock } = req.body;
  if (!name || !price || !description || !image_url || !category || !stock)
    return res.status(400).json({ message: "All fields are required" });

  await Product.create({ ...req.body, seller_id: req.user.id });
  res.status(201).json({ message: "Product added successfully" });
});

app.put("/update-product/:id", verifyToken("shopkeeper"), async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller_id: req.user.id });
  if (!product) return res.status(404).json({ message: "Product not found or not owned" });

  await Product.updateOne({ _id: req.params.id }, req.body);
  res.json({ message: "Product updated successfully!" });
});

app.delete("/delete-product/:id", verifyToken("shopkeeper"), async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id, seller_id: req.user.id });
  if (result.deletedCount === 0) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted successfully!" });
});

app.post("/add-to-cart", verifyToken(), async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id || !mongoose.Types.ObjectId.isValid(product_id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
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

    return res.json({
      success: true,
      message: "Added to cart!",
      cart: cartItems,
      totalItems: cartItems.length,
      totalPrice
    });

  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ message: "Server error" });
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
  } catch (err) {
    console.error(err);
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
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to remove" });
  }
});

app.post("/place-order", verifyToken(), async (req, res) => {
  console.log("[/place-order] Request received");
  console.log("User ID from token:", req.user?.id);
  console.log("Request body:", req.body);

  try {
    const { total_amount, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("Cart is empty or items missing");
      return res.status(400).json({ message: "Cart is empty" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log("Converted userId (ObjectId):", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User found:", { name: user.name, email: user.email });

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
        product_name:i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      })),
    });

    console.log("Order created successfully:", order._id);

    const cartUpdateResult = await Cart.updateOne(
      { user_id: userId },
      { $set: { items: [] } }
    );

    console.log("Cart clear result:", {
      matchedCount: cartUpdateResult.matchedCount,
      modifiedCount: cartUpdateResult.modifiedCount,
    });

    console.log("Order placed & cart cleared → Sending success response");

    res.json({
      success: true,
      message: "Order placed successfully!",
      orderId: order._id.toString(),
    });

  } catch (err) {
    console.error("Place order error:", err);
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

    const formattedOrders = orders.map(o => ({ ...o, order_id: o.order_id.toString() }));

    res.json(formattedOrders);

  } catch (err) {
    console.error("Error fetching seller orders:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// FIXED: Removed invalid .populate("customer") — this was breaking everything
app.get("/order/:orderId", verifyToken(), async (req, res) => {
  console.log("GET ORDER DETAILS - Order ID:", req.params.orderId);

  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "items.product_id",
        select: "name image_url"
      });

    if (!order) {
      console.log("ORDER NOT FOUND");
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

    console.log("TRANSFORMED ORDER:", transformedOrder);
    res.json(transformedOrder);

  } catch (err) {
    console.error("GET ORDER ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

app.put("/update-order/:orderId", verifyToken(), async (req, res) => {
  console.log("UPDATE ORDER STATUS - Order ID:", req.params.orderId);
  console.log("New Status:", req.body.status);
  
  try {
    const result = await Order.updateOne(
      { _id: req.params.orderId }, 
      { $set: { status: req.body.status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("ORDER STATUS UPDATED to:", req.body.status);
    res.json({ success: true, message: `Order status updated to ${req.body.status}` });
    
  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err.message);
    res.status(500).json({ message: "Failed to update order" });
  }
});

app.delete("/delete-order/:orderId", verifyToken(), async (req, res) => {
  console.log("DELETE ORDER - Order ID:", req.params.orderId);
  
  try {
    const result = await Order.deleteOne({ _id: req.params.orderId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("ORDER DELETED SUCCESSFULLY");
    res.json({ success: true, message: "Order deleted successfully" });
    
  } catch (err) {
    console.error("DELETE ORDER ERROR:", err.message);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

app.delete("/order-item/:orderItemId", verifyToken(), async (req, res) => {
  console.log("DELETE ORDER ITEM - Item ID:", req.params.orderItemId);
  
  try {
    const result = await Order.updateOne(
      { "items._id": req.params.orderItemId },
      { $pull: { items: { _id: req.params.orderItemId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Order item not found" });
    }

    console.log("ORDER ITEM DELETED");
    res.json({ success: true, message: "Item removed from order" });
    
  } catch (err) {
    console.error("DELETE ORDER ITEM ERROR:", err.message);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

app.get("/profile/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.put("/profile/:id", async (req, res) => {
  await User.updateOne({ _id: req.params.id }, req.body);
  res.json({ message: "Profile updated successfully!" });
});

app.get("/", (req, res) => res.send("E-Commerce MongoDB Server Running..."));
// At the end of server.js, fix this:
if(!process.env.VERCEL && !process.env.NETLIFY) {
  app.listen(PORT, () => {  // Changed "Port" to "PORT"
    console.log(`🚀 Server Live on Port ${PORT}`);
    console.log(`🌐 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  });
}

module.exports = app;