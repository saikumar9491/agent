require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const History = require('./models/History');
const { researchAgent } = require('./agent');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AI Agent Backend is Running', status: 'OK' });
});

app.use('/api/auth', authRoutes);

app.post('/api/research', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const initialState = {
      companyName,
      financials: null,
      news: [],
      decision: null,
      reasoning: '',
    };

    const finalState = await researchAgent.invoke(initialState);

    res.json({
      decision: finalState.decision,
      reasoning: finalState.reasoning,
      financials: finalState.financials,
      news: finalState.news,
      historicalData: finalState.historicalData,
      companyImage: finalState.companyImage,
      websiteDomain: finalState.websiteDomain,
      sentimentScore: finalState.sentimentScore,
    });
  } catch (err) {
    console.error("Research API Error:", err);
    res.status(500).json({ error: err.message || 'An error occurred during research.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const history = await History.find({ userId }).sort({ date: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { companyName, data } = req.body;
    const item = new History({ userId, companyName, data });
    await item.save();

    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing history ID' });

    await History.findOneAndDelete({ _id: id, userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete history' });
  }
});

// Database and Server Setup
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

