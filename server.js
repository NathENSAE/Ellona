const express = require("express");
const path = require("path");
// Use global fetch when available (Node 18+). Otherwise dynamically import node-fetch.
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(mod => mod.default(...args)));

const app = express();
const PORT = process.env.PORT || 3000;

const NEWS_API_KEY = '924969528cd748e4a2d029adaaed8e35';

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/src")));

// 🌟 NEW ENDPOINT FOR NEWSAPI 🌟
app.get('/api/news', async (req, res) => {
  console.log('Received request for /api/news');
  // Get the topic from the client's request query (e.g., /api/news?topic=crypto)
  const topic = req.query.topic || 'cars, crypto, anime, tft'; 
  // Encode the topic so spaces and special characters produce a valid URL
  const encodedTopic = encodeURIComponent(topic);
    
  // Construct the NewsAPI URL (encode query)
  const url = `https://newsapi.org/v2/everything?q=${encodedTopic}&sortBy=publishedAt&pageSize=5&language=fr&apiKey=${NEWS_API_KEY}`;
  console.log(`Constructed NewsAPI URL: ${url}`);
  try {
    console.log(`Fetching NewsAPI URL for topic: ${topic}`);
    const response = await fetch(url);
        
    if (!response.ok) {
      // Handle HTTP errors (e.g., 429 Rate Limit)
      const bodyText = await response.text().catch(() => '');
      console.error(`NewsAPI Error: ${response.status} - ${bodyText}`);
      return res.status(response.status).json({ error: 'Failed to fetch news from external API' });
    }
    
    const data = await response.json();
    // Send the articles back to the client
    res.json(data.articles);

  } catch (error) {
    console.error('Server-side fetch error:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Site démarré sur http://localhost:${PORT}`);
});