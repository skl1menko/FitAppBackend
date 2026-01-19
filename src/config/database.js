const {Pool} = require('pg');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Error connecting to the database:', err);
});

const initDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        //roles table
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            );
        `);
        //users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role_id INTEGER NOT NULL REFERENCES roles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        //connection table between trainers and clients
        await client.query(`
            CREATE TABLE IF NOT EXISTS trainer_clients (
                client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (trainer_id, client_id)
            )
        `);
        //exercises table
        await client.query(`
            CREATE TABLE IF NOT EXISTS exercises (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                muscle_group VARCHAR(100) NOT NULL,
                is_custom BOOLEAN DEFAULT FALSE,
                creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        //index on muscle_group for faster searches
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_exercises_muscle
            ON exercises (muscle_group);
        `);
        //training programs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS training_programs(
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        //program assignments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS program_assignments(
                id SERIAL PRIMARY KEY,
                program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
                athlete_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                assigned_by_id INTEGER NOT NULL REFERENCES users(id),
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (program_id, athlete_id)
            )
        `);
        
        //workouts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS workouts(
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                program_id INTEGER REFERENCES training_programs(id) ON DELETE SET NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                notes TEXT,
                total_tonnage DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        //workout_exercises table
        await client.query(`
            CREATE TABLE IF NOT EXISTS workout_exercises(
                id SERIAL PRIMARY KEY,
                workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
                exercise_id INTEGER NOT NULL REFERENCES exercises(id),
                exercise_order INTEGER,
                exercise_tonnage DECIMAL(10,2) DEFAULT 0
            )
        `);
        //workout_sets table
        await client.query(`
            CREATE TABLE IF NOT EXISTS workout_sets(
                id SERIAL PRIMARY KEY,
                workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
                weight_kg DECIMAL(10,2) NOT NULL,
                reps INTEGER NOT NULL,
                rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10)
            )
        `);
        //health_metrics table
        await client.query(`
            CREATE TABLE IF NOT EXISTS health_metrics(
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                workout_id INTEGER UNIQUE REFERENCES workouts(id) ON DELETE SET NULL,
                period_type VARCHAR(20) NOT NULL CHECK(period_type IN ('workout', 'daily', 'weekly', 'monthly')),
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                total_energy_burned DECIMAL(10,2),
                step_count INTEGER,
                avg_heart_rate INTEGER,
                source_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        //index on user_id and start_date for faster queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date
            ON health_metrics (user_id, start_date);   
        `);
        //index on workout_id for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_health_metrics_workout
            ON health_metrics (workout_id);   
        `);
        //body_measurements table
        await client.query(`
            CREATE TABLE IF NOT EXISTS body_measurements(
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                body_weight DECIMAL(5,2),
                height DECIMAL(5,2),
                chest DECIMAL(5,2),
                waist DECIMAL(5,2),
                hips DECIMAL(5,2),
                biceps DECIMAL(5,2),
                notes TEXT
            )
        `);

        await client.query(`
         INSERT INTO roles (name)
         VALUES ('athlete'), ('trainer')
         ON CONFLICT (name) DO NOTHING;   
        `);

        await client.query('COMMIT');
        console.log('Database initialized successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { pool, initDatabase };

    
 