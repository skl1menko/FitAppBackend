require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {initDatabase} = require('./src/config/database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Fitness APP API',
        status:'OK',
        version: '1.0.0'
    })
});

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
});

