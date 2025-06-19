// app.js
const express = require("express");
const mongoose = require("mongoose");
const logRoute = require("./routes/logRoute");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());

// Connect to MongoDB
 mongoose.connect('mongodb+srv://gopinathm:OZOiebX1pXOPv4Ov@cluster0.5uh0q.mongodb.net/LatLngDB?retryWrites=true&w=majority&appName=Cluster0', {
      dbName: 'LatLngDB',
    })
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api", logRoute);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
