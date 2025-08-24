const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // To use environment variables from .env file

const app = express();
const port = process.env.PORT || 8000; // You can run on port 8000

// --- Database Connection ---
// Make sure you have a .env file in your project root with your MONGO_URI
const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error('MONGO_URI not found in .env file. Please add it.');
}
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        // Connecting to your specific database
        db = client.db('ieee-game');
        console.log('Successfully connected to MongoDB Atlas database: ieee-game!');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1); // Exit if we can't connect to the DB
    }
}

// --- Middleware ---
// Serve static files (your game) from the 'public' directory
app.use(express.static('public'));
// Parse JSON bodies for POST requests (to submit scores)
app.use(express.json());

// --- API Routes ---

// GET /api/leaderboard - Fetches top 10 scores from the 'participant' collection
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.collection('participant')
            .find()
            .sort({ totalscore: -1 }) // Sorts by a field named 'totalscore'
            .limit(10)
            .toArray();
        res.json(leaderboard);
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

// POST /api/leaderboard - Submits a new score to the 'participant' collection
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { name, score } = req.body;

        if (!name || typeof score !== 'number') {
            return res.status(400).json({ message: 'Invalid name or score provided.' });
        }

        const newScore = {
            name: name.slice(0, 15), // Creates a field named 'name'
            totalscore: score,       // Creates a field named 'totalscore'
            createdAt: new Date(),
        };
        const result = await db.collection('participant').insertOne(newScore);
        res.status(201).json({ message: 'Score submitted successfully!', insertedId: result.insertedId });
    } catch (err) {
        console.error('Error submitting score:', err);
        res.status(500).json({ message: 'Error submitting score' });
    }
});

// --- Start Server ---
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});