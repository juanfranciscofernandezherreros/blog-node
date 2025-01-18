const express = require('express');
const router = express.Router();

// Routes
router.get('', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hello World</title>
            <link rel="stylesheet" href="/css/styles.css">
        </head>
        <body>
            <h1>Hello World</h1>
        </body>
        </html>
    `);
});

module.exports = router;
