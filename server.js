const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
// Correct way to import fetch for compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up SQLite database
const db = new sqlite3.Database('zesty.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS groceries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            purchaseDate INTEGER NOT NULL,
            estimatedExpiryDate INTEGER NOT NULL
        )`);
        console.log('Database connected and table ready.');
    }
});

// Helper function for exponential backoff during API calls
const exponentialBackoffFetch = async (url, options, retries = 3, delay = 1000) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        if (retries === 0) {
            throw error;
        }
        console.warn(`Fetch failed, retrying in ${delay}ms... Retries left: ${retries}`);
        await new Promise(res => setTimeout(res, delay));
        return exponentialBackoffFetch(url, options, retries - 1, delay * 2);
    }
};

// Function to get an expiry estimate from Gemini API
const getExpiryEstimate = async (itemName) => {
    const prompt = `Provide an estimated shelf life for a new, fresh item named "${itemName}" in days. Respond only with a JSON object. The object must contain a single key, "shelf_life_days", with an integer value. For example, for "apples", respond with: {"shelf_life_days": 21}.`;
    
    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "shelf_life_days": { "type": "NUMBER" }
                    },
                    propertyOrdering: ["shelf_life_days"]
                }
            }
        };

        const apiKey = "AIzaSyDVF0vRizuKYVQJQZyK8JdSS8wXmZJOPCo";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const response = await exponentialBackoffFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const parsedJson = JSON.parse(response.candidates[0].content.parts[0].text);
        return parsedJson.shelf_life_days;
    } catch (error) {
        console.error("Error fetching expiry estimate:", error);
        return null;
    }
};

// Function to generate a recipe from Gemini API
const generateRecipe = async (ingredients) => {
    const prompt = `Please provide a simple, easy-to-follow recipe that uses the following ingredients: ${ingredients.join(', ')}. The recipe should have a title, a brief description, a list of ingredients, and numbered step-by-step instructions.`;
    
    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };
        const apiKey = "AIzaSyDVF0vRizuKYVQJQZyK8JdSS8wXmZJOPCo";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const response = await exponentialBackoffFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error generating recipe:", error);
        return "Sorry, I couldn't generate a recipe with those ingredients. Please try again or select different ones.";
    }
};

// API endpoint to add a new grocery item
app.post('/api/groceries', async (req, res) => {
    const { name, quantity } = req.body;
    console.log('Received item:', { name, quantity });
    
    if (!name || !quantity) {
        return res.status(400).json({ error: 'Name and quantity are required.' });
    }

    const purchaseDate = Date.now();
    const shelfLife = await getExpiryEstimate(name);
    
    if (shelfLife === null) {
        return res.status(500).json({ error: 'Failed to get expiry estimate from AI.' });
    }

    const estimatedExpiryDate = purchaseDate + (shelfLife * 24 * 60 * 60 * 1000);

    const stmt = db.prepare("INSERT INTO groceries (name, quantity, purchaseDate, estimatedExpiryDate) VALUES (?, ?, ?, ?)");
    stmt.run(name, quantity, purchaseDate, estimatedExpiryDate, function(err) {
        if (err) {
            console.error('Database error on insert:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Item added successfully', id: this.lastID });
    });
    stmt.finalize();
});

// API endpoint to get all grocery items
app.get('/api/groceries', (req, res) => {
    db.all("SELECT * FROM groceries", [], (err, rows) => {
        if (err) {
            console.error('Database error on select:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API endpoint to delete a grocery item
app.delete('/api/groceries/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM groceries WHERE id = ?`, id, function(err) {
        if (err) {
            console.error('Database error on delete:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Item with ID ${id} deleted.` });
    });
});

// New API endpoint to get a recipe
app.get('/api/recipes', async (req, res) => {
    const ingredients = req.query.ingredients ? req.query.ingredients.split(',') : [];

    if (ingredients.length === 0) {
        return res.status(400).json({ error: "No ingredients provided for recipe generation." });
    }

    const recipeText = await generateRecipe(ingredients);
    res.json({ recipe: recipeText });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
