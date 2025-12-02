// server.js - FIXED FOR VERCEL WITH TIMEOUT HANDLING
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// ==================== CORS CONFIGURATION ====================
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// ==================== MONGODB CONNECTION WITH TIMEOUT ====================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://tayyab:12345@cluster0.7ehzawj.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0&serverSelectionTimeoutMS=10000&socketTimeoutMS=45000&connectTimeoutMS=10000";

// Global connection state
let dbConnected = false;
let connectionPromise = null;

async function connectDB() {
  if (dbConnected) return true;
  
  if (connectionPromise) {
    return connectionPromise;
  }
  
  connectionPromise = mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,  // Increased to 10 seconds
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    dbConnected = true;
    connectionPromise = null;
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      dbConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      dbConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      dbConnected = true;
    });
    
    return true;
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    dbConnected = false;
    connectionPromise = null;
    return false;
  });
  
  return connectionPromise;
}

// Connect on startup (non-blocking)
connectDB().then(connected => {
  if (connected) {
    console.log("Database ready");
  } else {
    console.log("Database connection failed, API will run with limited functionality");
  }
});

// ==================== MIDDLEWARE TO CHECK DB ====================
const checkDB = async (req, res, next) => {
  if (!dbConnected) {
    const connected = await connectDB();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database temporarily unavailable. Please try again.",
        error: "DB_CONNECTION_FAILED"
      });
    }
  }
  next();
};

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

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-Commerce API",
    status: "online",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ==================== HEALTH ENDPOINT ====================
app.get("/health", async (req, res) => {
  const dbStatus = dbConnected ? "connected" : "disconnected";
  
  res.json({
    success: true,
    status: "healthy",
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==================== ROUTES ====================

app.post("/signup", checkDB, async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: "All required fields must be provided" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone, address, role });
    
    const token = jwt.sign({ id: user.id, role: user.role }, "secretkey", { expiresIn: "1d" });

    res.status(201).json({ 
      success: true,
      message: "User registered successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during signup",
      error: error.message 
    });
  }
});

app.post("/login", checkDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, "secretkey", { expiresIn: "1d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      address: user.address || "",
      phone: user.phone,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login",
      error: error.message 
    });
  }
});

app.get("/products", checkDB, async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Products error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch products",
      error: error.message 
    });
  }
});

app.post("/add-product", checkDB, verifyToken("shopkeeper"), async (req, res) => {
  try {
    const { name, price, description, image_url, category, stock } = req.body;
    if (!name || !price || !description || !image_url || !category || !stock)
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });

    const product = await Product.create({ ...req.body, seller_id: req.user.id });
    
    res.status(201).json({ 
      success: true,
      message: "Product added successfully",
      product
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to add product",
      error: error.message 
    });
  }
});

app.put("/update-product/:id", checkDB, verifyToken("shopkeeper"), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller_id: req.user.id });
    if (!product) return res.status(404).json({ 
      success: false,
      message: "Product not found or not owned" 
    });

    await Product.updateOne({ _id: req.params.id }, req.body);
    
    res.json({ 
      success: true,
      message: "Product updated successfully!" 
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update product",
      error: error.message 
    });
  }
});

app.delete("/delete-product/:id", checkDB, verifyToken("shopkeeper"), async (req, res) => {
  try {
    const result = await Product.deleteOne({ _id: req.params.id, seller_id: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ 
      success: false,
      message: "Product not found" 
    });
    
    res.json({ 
      success: true,
      message: "Product deleted successfully!" 
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete product",
      error: error.message 
    });
  }
});

app.post("/add-to-cart", checkDB, verifyToken(), async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || !mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid product ID" 
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const prodId = new mongoose.Types.ObjectId(product_id);

    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
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
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

app.get("/cart", checkDB, verifyToken(), async (req, res) => {
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
    res.status(500).json({ 
      success: false,
      message: "Error fetching cart",
      error: error.message 
    });
  }
});

app.put("/cart/update", checkDB, verifyToken(), async (req, res) => {
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
    res.status(500).json({ 
      success: false,
      error: "Update failed",
      message: error.message 
    });
  }
});

app.delete("/cart/item", checkDB, verifyToken(), async (req, res) => {
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
    res.status(500).json({ 
      success: false,
      error: "Failed to remove",
      message: error.message 
    });
  }
});

app.post("/place-order", checkDB, verifyToken(), async (req, res) => {
  try {
    const { total_amount, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Cart is empty" 
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
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
    res.status(500).json({ 
      success: false,
      message: "Failed to place order",
      error: error.message 
    });
  }
});

app.get("/orders", checkDB, verifyToken("shopkeeper"), async (req, res) => {
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

  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

app.get("/order/:orderId", checkDB, verifyToken(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "items.product_id",
        select: "name image_url"
      });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
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
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch order",
      error: error.message 
    });
  }
});

app.put("/update-order/:orderId", checkDB, verifyToken(), async (req, res) => {
  try {
    const result = await Order.updateOne(
      { _id: req.params.orderId }, 
      { $set: { status: req.body.status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      message: `Order status updated to ${req.body.status}` 
    });
    
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update order",
      error: error.message 
    });
  }
});

app.delete("/delete-order/:orderId", checkDB, verifyToken(), async (req, res) => {
  try {
    const result = await Order.deleteOne({ _id: req.params.orderId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Order deleted successfully" 
    });
    
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete order",
      error: error.message 
    });
  }
});

app.delete("/order-item/:orderItemId", checkDB, verifyToken(), async (req, res) => {
  try {
    const result = await Order.updateOne(
      { "items._id": req.params.orderItemId },
      { $pull: { items: { _id: req.params.orderItemId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Order item not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Item removed from order" 
    });
    
  } catch (error) {
    console.error("DELETE ORDER ITEM ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove item",
      error: error.message 
    });
  }
});

app.get("/profile/:id", checkDB, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ 
      success: false,
      message: "User not found" 
    });
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch profile",
      error: error.message 
    });
  }
});

app.put("/profile/:id", checkDB, async (req, res) => {
  try {
    await User.updateOne({ _id: req.params.id }, req.body);
    
    res.json({ 
      success: true,
      message: "Profile updated successfully!" 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update profile",
      error: error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================
// Catch 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found" 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ 
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
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