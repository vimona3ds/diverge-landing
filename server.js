const express = require('express');
const path = require('path');

const app = express();
const port = 3333;

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve 3dtest.html at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '3dtest.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 