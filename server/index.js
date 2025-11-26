const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: ' sql12.freesqldatabase.com',
    user: 'sql12809473',      // Your MySQL username
    password: ' ecBbYFwu5t', // Your MySQL password
    database: 'sql12809473'
});

db.connect(err => {
    if (err) console.log('DB Connection Error:', err);
    else console.log('Connected to MySQL Database');
});

// --- API ROUTES ---

// 1. GET ALL TASKS
app.get('/tasks', (req, res) => {
    const sql = "SELECT * FROM tasks";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        // Format date slightly to match React expectation if needed
        return res.json(data); 
    });
});

// 2. ADD A TASK
app.post('/tasks', (req, res) => {
    const sql = "INSERT INTO tasks (`title`, `date`, `priority`, `completed`) VALUES (?)";
    const values = [
        req.body.title,
        req.body.date,
        req.body.priority,
        false
    ];
    db.query(sql, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json({ id: data.insertId, ...req.body, completed: false });
    });
});

// 3. UPDATE TASK (Title, Date, or Priority)
app.put('/tasks/:id', (req, res) => {
    const id = req.params.id;
    // We update everything sent in the body
    const sql = "UPDATE tasks SET title = ?, date = ?, completed = ? WHERE id = ?";
    db.query(sql, [req.body.title, req.body.date, req.body.completed, id], (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// 4. DELETE TASK
app.delete('/tasks/:id', (req, res) => {
    const sql = "DELETE FROM tasks WHERE id = ?";
    const id = req.params.id;
    db.query(sql, [id], (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.listen(8081, () => {
    console.log("Listening on port 8081");
});