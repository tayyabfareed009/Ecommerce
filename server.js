// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path=require("path");


const app = express();
app.use(express.json());
app.use(cors());

// ==================== DATABASE CONNECTION ====================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // your MySQL password (leave blank if none)
  database: "ecommerce",
});

db.connect((err) => {
  if (err) console.log("DB Connection Error:", err);
  else console.log("✅ Connected to MySQL Database");
});

// ==================== JWT & ROLE MIDDLEWARE ====================
const verifyToken = (requiredRole) => (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  jwt.verify(token.split(" ")[1], "secretkey", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    if (requiredRole && decoded.role !== requiredRole) {
      return res.status(403).json({ message: "Access denied. Not authorized." });
    }
    req.user = decoded; // decoded info
    next();
  });
};

// ==================== USER SIGNUP ====================
app.post("/signup", async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  try {
    // Check if user already exists
    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], async (err, results) => {
      if (err) {
        console.error("DB error (check existing user):", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password securely
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const insertSql = `
        INSERT INTO users (name, email, password, phone, address, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(insertSql, [name, email, hashedPassword, phone, address, role], (err, result) => {
        if (err) {
          console.error("DB error (insert user):", err);
          return res.status(500).json({ message: "Signup failed" });
        }

        console.log("✅ New user registered:", { id: result.insertId, name, email, role });
        res.status(201).json({ message: "User registered successfully!" });
      });
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ==================== USER LOGIN ====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("📥 Login request received:", { email, password });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      console.log("⚠️ No user found with email:", email);
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("⚠️ Wrong password for:", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, "secretkey", { expiresIn: "1d" });
    console.log("✅ Login success:", user.name);

    res.json({
      message: "Login successful",
      token,
      id:user.id,
      role: user.role,
      name: user.name,
      address:user.address,
      email:user.email,
      
    });
    console.log("✅ Login response sent:", {
  token,
  role: user.role,
  name: user.name,
   address:user.address,
  email:user.email,

});
  });
});


// ==================== GET PRODUCTS ====================
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching products" });
    res.json(results);
  });
});
// ==================== Add PRODUCTS ====================

app.post("/add-product", verifyToken("shopkeeper"), (req, res) => {
  const { name, price, description, image_url, category, stock } = req.body;

  if (!name || !price || !description || !image_url || !category || !stock) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sellerId = req.user.id;

  const sql = `
    INSERT INTO products (name, description, price, image_url, category, stock, seller_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, description, price, image_url, category, stock, sellerId], (err, result) => {
    if (err) {
      console.error("❌ SQL Error:", err.sqlMessage || err.message);
      return res.status(500).json({ message: "Failed to save product", error: err.sqlMessage });
    }
    res.status(201).json({ message: "✅ Product added successfully" });
  });
});


// ==================== UPDATE PRODUCT (Shopkeeper Only) ====================
app.put("/update-product/:id", verifyToken("shopkeeper"), (req, res) => {
  const productId = req.params.id;
  const { name, description, price, image_url, category, stock } = req.body;

  // ✅ Validate input
  if (!name || !description || !price || !image_url || !category || !stock) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // ✅ Update query with matching table fields
  const sql = `
    UPDATE products 
    SET 
      name = ?, 
      description = ?, 
      price = ?, 
      image_url = ?, 
      category = ?, 
      stock = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, description, price, image_url, category, stock, productId],
    (err, result) => {
      if (err) {
        console.error("❌ SQL Error:", err);
        return res.status(500).json({ message: "Failed to update product" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      console.log("✅ Product updated successfully — ID:", productId);
      res.json({ message: "✅ Product updated successfully!" });
    }
  );
});

// ==================== DELETE PRODUCT (Shopkeeper Only) ====================
app.delete("/delete-product/:id", verifyToken("shopkeeper"), (req, res) => {
  const productId = req.params.id;

  db.query("DELETE FROM products WHERE id = ?", [productId], (err, result) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ message: "Failed to delete product" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("🗑️ Product deleted successfully — ID:", productId);
    res.json({ message: "🗑️ Product deleted successfully!" });
  });
});
// ==================== ADD TO CART ====================
app.post("/add-to-cart", (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  console.log("🛒 Add to Cart Request:", { user_id, product_id, quantity });

  if (!user_id) {
    console.log("❌ Missing user_id");
    return res.status(400).json({ message: "user_id is required" });
  }

  const sql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
  db.query(sql, [user_id, product_id, quantity], (err, result) => {
    if (err) {
      console.error("❌ SQL Error adding to cart:", err);
      return res.status(500).json({ message: "Error adding to cart" });
    }
    console.log("✅ Added to cart successfully:", result);
    res.json({ message: "Item added to cart!" });
  });
});
app.get("/cart/:id", (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ SQL Error fetching cart:", err);
      return res.status(500).json({ message: "Error fetching cart" });
    }
    res.json(results);
  });
});

app.delete("/cart/:cart_id", (req, res) => {
  const cartId = req.params.cart_id;

  // First, get the user_id of the cart item
  const getUserSql = "SELECT user_id FROM cart WHERE id = ?";
  db.query(getUserSql, [cartId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching cart item" });
    if (results.length === 0) return res.status(404).json({ message: "Item not found in cart" });

    const userId = results[0].user_id;

    // Now delete the item
    const deleteSql = "DELETE FROM cart WHERE id = ?";
    db.query(deleteSql, [cartId], (err, result) => {
      if (err) return res.status(500).json({ message: "Error removing item" });

      // Fetch updated cart
      const fetchCartSql = `
        SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `;
      db.query(fetchCartSql, [userId], (err, items) => {
        if (err) return res.status(500).json({ message: "Error fetching updated cart" });
        res.json({ message: "Item removed successfully", cart: items });
      });
    });
  });
});



// ==================== PLACE ORDER ====================
app.post("/place-order", (req, res) => {
  const { user_id, total_amount, items } = req.body;

  const orderSql =
    "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'Pending')";
  db.query(orderSql, [user_id, total_amount], (err, orderResult) => {
    if (err) return res.status(500).json({ message: "Error placing order" });

    const orderId = orderResult.insertId;
    const itemSql =
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";
    const values = items.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    db.query(itemSql, [values], (err2) => {
      if (err2) return res.status(500).json({ message: "Error saving order items" });

      // Clear cart after placing order
      const cartIds = items.map((item) => item.id);
      if (cartIds.length > 0) {
        db.query("DELETE FROM cart WHERE id IN (?)", [cartIds]);
      }

      res.json({ message: "Order placed successfully!" });
    });
  });
});

// ==================== VIEW ORDERS (Seller Only) ====================
app.get("/orders", verifyToken("shopkeeper"), (req, res) => {
  const sellerId = req.user.id;

  const sql = `
    SELECT 
      o.id AS order_id,
      u.name AS customer_name,
      o.total_amount,
      o.status,
      o.order_date,
      p.name AS product_name,
      oi.quantity,
      oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN users u ON o.user_id = u.id
    WHERE p.seller_id = ?
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [sellerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching orders" });

    const orders = {};
    results.forEach(row => {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          customer_name: row.customer_name,
          total_amount: row.total_amount,
          status: row.status,
          order_date: row.order_date,
          items: [],
        };
      }
      orders[row.order_id].items.push({
        product_name: row.product_name,
        quantity: row.quantity,
        price: row.price,
      });
    });

    res.json(Object.values(orders));
  });
});

// GET single order details (any authenticated user)
app.get("/order/:id", verifyToken(), (req, res) => {
  const orderId = req.params.id;

  const sql = `
    SELECT o.id, o.user_id, u.name AS customer_name, u.address, 
           o.total_amount, o.status, o.order_date
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?;
  `;

  db.query(sql, [orderId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching order" });
    if (results.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = results[0];

    const itemsSql = `
      SELECT oi.id AS order_item_id, oi.product_id, p.name AS product_name, oi.quantity, oi.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?;
    `;

    db.query(itemsSql, [orderId], (err, items) => {
      if (err) return res.status(500).json({ message: "Error fetching items" });
      order.items = items;
      res.json(order);
    });
  });
});

// UPDATE order status (shopkeeper only)
app.put("/update-order/:id", verifyToken("shopkeeper"), (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId], (err) => {
    if (err) return res.status(500).json({ message: "Error updating status" });
    res.json({ message: "Order status updated!" });
  });
});
/// DELETE single order item (shopkeeper only)
app.delete("/order-item/:id", verifyToken("shopkeeper"), (req, res) => {
  const itemId = req.params.id;

  console.log("🗑️ DELETE ORDER ITEM - Request received");
  console.log("📦 Item ID from frontend:", itemId);
  console.log("👤 Shopkeeper:", req.user.id);

  db.query("DELETE FROM order_items WHERE id=?", [itemId], (err, result) => {
    if (err) {
      console.error("❌ DELETE FAILED - Item ID:", itemId, "Error:", err.message);
      return res.status(500).json({ message: "Error deleting item" });
    }

    console.log("✅ DELETE SUCCESS - Item ID:", itemId, "Rows affected:", result.affectedRows);
    res.json({ message: "Item deleted", deletedItemId: itemId });
  });
});

// DELETE entire order (shopkeeper only)
app.delete("/delete-order/:id", verifyToken("shopkeeper"), (req, res) => {
  const orderId = req.params.id;

  console.log("🗑️ DELETE ENTIRE ORDER - Request received");
  console.log("📦 Order ID from frontend:", orderId);
  console.log("👤 Shopkeeper:", req.user.id);

  // Step 1: Delete order items
  db.query("DELETE FROM order_items WHERE order_id=?", [orderId], (err, itemsResult) => {
    if (err) {
      console.error("❌ DELETE ORDER ITEMS FAILED - Order ID:", orderId, "Error:", err.message);
      return res.status(500).json({ message: "Error deleting order items" });
    }

    console.log("✅ ORDER ITEMS DELETED - Order ID:", orderId, "Items removed:", itemsResult.affectedRows);

    // Step 2: Delete order itself
    db.query("DELETE FROM orders WHERE id=?", [orderId], (err2, orderResult) => {
      if (err2) {
        console.error("❌ DELETE ORDER FAILED - Order ID:", orderId, "Error:", err2.message);
        return res.status(500).json({ message: "Error deleting order" });
      }

      console.log("✅ ENTIRE ORDER DELETED - Order ID:", orderId, "Order removed");
      res.json({ message: "Order deleted" });
    });
  });
});

// ==================== GET PROFILE ====================
app.get("/profile/:id", (req, res) => {
  const userId = req.params.id;

  console.log("📥 GET /profile/:id called with ID:", userId);

  db.query(
    "SELECT id, name, email, phone, address, image, role FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching profile:", err);
        return res.status(500).json({ message: "Error fetching profile" });
      }

      if (results.length === 0) {
        console.log("⚠️ No user found for ID:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ Profile fetched successfully:", results[0]);
      res.json(results[0]);
    }
  );
});

// ==================== UPDATE PROFILE ====================
app.put("/profile/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, address, image } = req.body;

  console.log("📤 PUT /profile/:id called with data:", {
    userId,
    name,
    email,
    phone,
    address,
    image,
  });

  db.query(
    "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, image = ? WHERE id = ?",
    [name, email, phone, address, image, userId],
    (err, result) => {
      if (err) {
        console.error("❌ Error updating profile:", err);
        return res.status(500).json({ message: "Error updating profile" });
      }

      console.log("✅ Profile updated successfully for user ID:", userId);
      res.json({ message: "Profile updated successfully!" });
    }
  );
});



// ==================== DEFAULT ROUTE ====================
app.get("/", (req, res) => {
  res.send("✅ E-Commerce Server Running...");
});

// ==================== START SERVER ====================
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));

