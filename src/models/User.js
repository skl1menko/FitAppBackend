const {pool} = require('../config/database');

class User{
    static async create(email,passwordHash,fullName, roleId){
        const result = await pool.query(
            `INSERT INTO users(email, password_hash, full_name, role_id)
            VALUES($1, $2, $3, $4) RETURNING id`,
            [email, passwordHash, fullName, roleId]
        );
        return {id: result.rows[0].id};
    }

    static async findByEmail(email){
        const result = await pool.query(
            `SELECT u.*, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = $1`,
            [email]
        );
        return result.rows[0];
    }

    static async findById(id){
        const result = await pool.query(
            `SELECT u.*, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getAllUsers(){
        const result = await pool.query(
            `SELECT u.id, u.email, u.full_name, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id`
        );
        return result.rows;
    }

    static async updateUser(id,fullName){
        const result = await pool.query(
            `UPDATE users SET full_name = $1 WHERE id = $2`,
            [fullName, id]
        );
        return {changes: result.rowCount}
    }

    static async deleteUserById(id){
        const result = await pool.query(
            `DELETE FROM users WHERE id = $1`,
            [id]
        );
        return {deleted: result.rowCount}
    }

    static async getTrainerClients(trainerId){
        const result = await pool.query(
            `SELECT u.id, u.email, u.full_name, tc.assigned_at
            FROM trainer_clients tc
            JOIN users u ON tc.client_id = u.id
            WHERE tc.trainer_id = $1`,
            [trainerId]
        );
        return result.rows;
    }

    static async assignClientToTrainer(clientId, trainerId){
        const result = await pool.query(
            `INSERT INTO trainer_clients(client_id, trainer_id)
            VALUES($1, $2)`,
            [clientId, trainerId]
        );
        return {success: true};
    }

    static async removeClientFromTrainer(clientId, trainerId){
        const result = await pool.query(
            `DELETE FROM trainer_clients
            WHERE client_id = $1 AND trainer_id = $2`,
            [clientId, trainerId]
        );
        return {removed: result.rowCount};
    }
}

module.exports = User;