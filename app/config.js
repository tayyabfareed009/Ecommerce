// config.js
export const API_URL = __DEV__ 
  ? "http://localhost:5000"  // Development
  : "https://ecommerce-roan-tau.vercel.app"; // Production (your Vercel URL)

// OR use environment variable
// export const API_URL = process.env.API_URL || "http://localhost:5000";