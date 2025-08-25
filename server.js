const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors'); // Import the cors package
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// --- Database Connection ---
const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error('MONGO_URI not found in .env file. Please add it.');
}
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('ieee-game');
        console.log('Successfully connected to MongoDB Atlas database: ieee-game!');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

// --- Middleware ---
app.use(cors()); // Use CORS to allow cross-origin requests
app.use(express.static('public'));
app.use(express.json());

// --- API Routes ---

// POST /api/auth - Checks if a participant exists
app.post('/api/auth', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name is required.' });
        }
        const participant = await db.collection('participants').findOne({ name: name });
        if (participant) {
            res.status(200).json({ message: 'Authentication successful.' });
        } else {
            res.status(404).json({ message: 'Participant not found. Please check your name.' });
        }
    } catch (err) {
        console.error('Error during authentication:', err);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
});

// GET /api/leaderboard - Fetches top 10 scores from the 'participant' collection
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.collection('participants')
            .find()
            .sort({ totalscore: -1 })
            .limit(10)
            .toArray();
        res.json(leaderboard);
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

// POST /api/leaderboard - Updates an existing participant's score
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { name, score } = req.body;
        if (!name || typeof score !== 'number') {
            return res.status(400).json({ message: 'Invalid name or score provided.' });
        }
        const result = await db.collection('participants').findOneAndUpdate(
            { name: name },
            { $set: { totalscore: score } }
        );
        if (result) {
            res.status(200).json({ message: 'Score updated successfully!' });
        } else {
            res.status(404).json({ message: 'Could not find participant to update score.' });
        }
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