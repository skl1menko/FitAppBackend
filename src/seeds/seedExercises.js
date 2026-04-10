require("dotenv").config();
const { pool, initDatabase } = require("../config/database");
const groups = require("./exercises.data");


async function seedExercises() {
  await initDatabase();
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS uq_system_exercise_name_group
          ON exercises (LOWER(name), LOWER(muscle_group))
          WHERE is_custom = false;
        `);

        const insertQuery = `
            INSERT INTO exercises (name, muscle_group, description, image_url, is_custom, creator_id)
            VALUES ($1, $2, $3, $4, false, null)
            ON CONFLICT DO NOTHING
          `;

            let inserted = 0;

            for (const group of groups){
                for (const ex of group.exercises){
                    const result = await client.query(insertQuery, [
                        ex.name,
                        group.muscle_group,
                      ex.description || null,
                      ex.image_url 
                    ]);
                    inserted += result.rowCount;
                }
            }

        await client.query("COMMIT");
        console.log(`Seed completed. Inserted rows: ${inserted}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedExercises();