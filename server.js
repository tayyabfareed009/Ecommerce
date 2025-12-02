// test-server.js - Minimal working version
const express = require('express');
const app = express();

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Test route
app.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint works!', data: req.body });
});

// Export for Vercel
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
}