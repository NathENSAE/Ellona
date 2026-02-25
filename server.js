const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

// Use global fetch when available (Node 18+). Otherwise dynamically import node-fetch.
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(mod => mod.default(...args)));

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

// Middleware to ensure DB connection for API routes
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

// Photo Schema
const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  position: { type: Number, default: 0 }
});
const Photo = mongoose.models.Photo || mongoose.model("Photo", photoSchema);

app.use(express.json()); // Essential for parsing JSON bodies
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/src")));

const NEWS_API_KEY = '924969528cd748e4a2d029adaaed8e35';

// --- PHOTO API ENDPOINTS ---

// Get all photos
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ position: 1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new photo
app.post('/api/photos', async (req, res) => {
  try {
    const { url } = req.body;
    // Get the current max position to place it at the end
    const lastPhoto = await Photo.findOne().sort({ position: -1 });
    const nextPosition = lastPhoto ? lastPhoto.position + 1 : 0;

    const newPhoto = new Photo({ url, position: nextPosition });
    await newPhoto.save();
    res.json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update photo positions (for reordering)
app.put('/api/photos/order', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, position }
    for (const update of updates) {
      await Photo.findByIdAndUpdate(update.id, { position: update.position });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a photo
app.delete('/api/photos/:id', async (req, res) => {
  try {
    await Photo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🌟 NEW ENDPOINT FOR NEWSAPI 🌟
app.get('/api/news', async (req, res) => {
  console.log('Received request for /api/news');
  const topic = req.query.topic || 'cars, crypto, anime, tft';
  const encodedTopic = encodeURIComponent(topic);
  const url = `https://newsapi.org/v2/everything?q=${encodedTopic}&sortBy=publishedAt&pageSize=5&language=fr&apiKey=${NEWS_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error(`NewsAPI Error: ${response.status} - ${bodyText}`);
      return res.status(response.status).json({ error: 'Failed to fetch news from external API' });
    }
    const data = await response.json();
    res.json(data.articles);
  } catch (error) {
    console.error('Server-side fetch error:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Site démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;