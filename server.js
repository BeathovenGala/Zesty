const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up SQLite database
const db = new sqlite3.Database('sustainplate.db', (err) => {
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

// API endpoint to add a new grocery item
app.post('/api/groceries', (req, res) => {
    const { name, quantity, estimatedExpiryDate } = req.body;
    const purchaseDate = Date.now();
    const stmt = db.prepare("INSERT INTO groceries (name, quantity, purchaseDate, estimatedExpiryDate) VALUES (?, ?, ?, ?)");
    stmt.run(name, quantity, purchaseDate, estimatedExpiryDate, function(err) {
        if (err) {
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
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Item with ID ${id} deleted.` });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});