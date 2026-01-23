require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {initDatabase} = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const exerciseRoutes = require('./src/routes/exerciseRoutes');
const workoutRoutes = require('./src/routes/workoutRoutes/workoutRoutes');
const workoutExerciseRoutes = require('./src/routes/workoutRoutes/workoutExerciseRoutes');
const workoutSetRoutes = require('./src/routes/workoutRoutes/workoutSetRoutes');


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

app.use('/api/auth', authRoutes);

app.use('/api/exercises', exerciseRoutes);

app.use('/api/workouts', workoutRoutes);

app.use('/api/workouts', workoutExerciseRoutes);

app.use('/api/workouts', workoutSetRoutes);

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
});

