const {pool} = require('../config/database');

class User{
    static async createUser(email,passwordHash,fullName, roleId){
        const result = await pool.query(
            `INSERT INTO users(email, password_hash, full_name, role_id)
            VALUES($1, $2, $3, $4) RETURNING id`,
            [email, passwordHash, fullName, roleId]
        );
        return {id: result.rows[0].id};
    }

    static async findUserByEmail(email){
        const result = await pool.query(
            `SELECT u.*, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = $1`,
            [email]
        );
        return result.rows[0];
    }

    static async findUserById(id){
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

    static async updateUser(id, fullName, imageUrl){
        const result = await pool.query(
            `UPDATE users
             SET full_name = $1,
                 image_url = $2
             WHERE id = $3`,
            [fullName, imageUrl, id]
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
            WHERE tc.trainer_id = $1
              AND tc.status = 'accepted'`,
            [trainerId]
        );
        return result.rows;
    }

    static async getAthleteTrainer(athleteId){
        const result = await pool.query(
            `SELECT u.id, u.email, u.full_name, tc.assigned_at
             FROM trainer_clients tc
             JOIN users u ON tc.trainer_id = u.id
             WHERE tc.client_id = $1
               AND tc.status = 'accepted'`,
            [athleteId]
        );
        return result.rows[0] || null;
    }

    static async getTrainerClientLinkByAthleteId(athleteId){
        const result = await pool.query(
            `SELECT client_id, trainer_id, status, requested_by_id, assigned_at
             FROM trainer_clients
             WHERE client_id = $1`,
            [athleteId]
        );
        return result.rows[0] || null;
    }

    static async searchTrainers(query = ''){
        const searchTerm = `%${query.trim()}%`;
        const result = await pool.query(
            `SELECT u.id, u.email, u.full_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE r.name = 'trainer'
               AND ($1 = '%%' OR u.full_name ILIKE $1 OR u.email ILIKE $1)
             ORDER BY u.full_name ASC, u.id ASC
             LIMIT 30`,
            [searchTerm]
        );
        return result.rows;
    }

    static async searchAthletesForTrainer(query = ''){
        const searchTerm = `%${query.trim()}%`;
        const result = await pool.query(
            `SELECT
                u.id,
                u.email,
                u.full_name,
                tc.trainer_id AS current_trainer_id,
                t.full_name AS current_trainer_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN trainer_clients tc ON tc.client_id = u.id
             LEFT JOIN users t ON t.id = tc.trainer_id
             WHERE r.name = 'athlete'
               AND (tc.status = 'accepted' OR tc.status IS NULL)
               AND ($1 = '%%' OR u.full_name ILIKE $1 OR u.email ILIKE $1)
             ORDER BY u.full_name ASC, u.id ASC
             LIMIT 30`,
            [searchTerm]
        );
        return result.rows;
    }

    static async createPendingTrainerClientRequest(athleteId, trainerId, requestedById){
        const result = await pool.query(
            `INSERT INTO trainer_clients(client_id, trainer_id, status, requested_by_id, assigned_at, responded_at)
             VALUES($1, $2, 'pending', $3, CURRENT_TIMESTAMP, NULL)
             ON CONFLICT (client_id)
             DO UPDATE SET
                trainer_id = EXCLUDED.trainer_id,
                status = 'pending',
                requested_by_id = EXCLUDED.requested_by_id,
                assigned_at = CURRENT_TIMESTAMP,
                responded_at = NULL
             WHERE trainer_clients.status = 'pending'
             RETURNING client_id, trainer_id, status, requested_by_id, assigned_at`,
            [athleteId, trainerId, requestedById]
        );
        return result.rows[0] || null;
    }

    static async getIncomingTrainerClientRequests(userId, role){
        const recipientField = role === 'trainer' ? 'tc.trainer_id' : 'tc.client_id';
        const result = await pool.query(
            `SELECT
                tc.client_id AS athlete_id,
                athlete.full_name AS athlete_name,
                athlete.email AS athlete_email,
                tc.trainer_id,
                trainer.full_name AS trainer_name,
                trainer.email AS trainer_email,
                tc.requested_by_id,
                requester_role.name AS requested_by_role,
                tc.assigned_at AS created_at
             FROM trainer_clients tc
             JOIN users athlete ON athlete.id = tc.client_id
             JOIN users trainer ON trainer.id = tc.trainer_id
             JOIN users requester ON requester.id = tc.requested_by_id
             JOIN roles requester_role ON requester_role.id = requester.role_id
             WHERE tc.status = 'pending'
               AND ${recipientField} = $1
               AND tc.requested_by_id <> $1
             ORDER BY tc.assigned_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async getOutgoingTrainerClientRequests(userId){
        const result = await pool.query(
            `SELECT
                tc.client_id AS athlete_id,
                athlete.full_name AS athlete_name,
                athlete.email AS athlete_email,
                tc.trainer_id,
                trainer.full_name AS trainer_name,
                trainer.email AS trainer_email,
                tc.requested_by_id,
                requester_role.name AS requested_by_role,
                tc.assigned_at AS created_at
             FROM trainer_clients tc
             JOIN users athlete ON athlete.id = tc.client_id
             JOIN users trainer ON trainer.id = tc.trainer_id
             JOIN users requester ON requester.id = tc.requested_by_id
             JOIN roles requester_role ON requester_role.id = requester.role_id
             WHERE tc.status = 'pending'
               AND tc.requested_by_id = $1
             ORDER BY tc.assigned_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async getPendingTrainerClientRequest(athleteId, trainerId){
        const result = await pool.query(
            `SELECT
                tc.client_id AS athlete_id,
                athlete.full_name AS athlete_name,
                athlete.email AS athlete_email,
                tc.trainer_id,
                trainer.full_name AS trainer_name,
                trainer.email AS trainer_email,
                tc.requested_by_id,
                requester_role.name AS requested_by_role,
                tc.status,
                tc.assigned_at AS created_at
             FROM trainer_clients tc
             JOIN users athlete ON athlete.id = tc.client_id
             JOIN users trainer ON trainer.id = tc.trainer_id
             LEFT JOIN users requester ON requester.id = tc.requested_by_id
             LEFT JOIN roles requester_role ON requester_role.id = requester.role_id
             WHERE tc.client_id = $1
               AND tc.trainer_id = $2
               AND tc.status = 'pending'`,
            [athleteId, trainerId]
        );
        return result.rows[0] || null;
    }

    static async approvePendingTrainerClientRequest(athleteId, trainerId){
        const result = await pool.query(
            `UPDATE trainer_clients
             SET status = 'accepted',
                 requested_by_id = NULL,
                 responded_at = CURRENT_TIMESTAMP
             WHERE client_id = $1
               AND trainer_id = $2
               AND status = 'pending'`,
            [athleteId, trainerId]
        );
        return {updated: result.rowCount};
    }

    static async rejectPendingTrainerClientRequest(athleteId, trainerId){
        const result = await pool.query(
            `DELETE FROM trainer_clients
             WHERE client_id = $1
               AND trainer_id = $2
               AND status = 'pending'`,
            [athleteId, trainerId]
        );
        return {deleted: result.rowCount};
    }

    static async assignClientToTrainer(clientId, trainerId){
        const result = await pool.query(
            `INSERT INTO trainer_clients(client_id, trainer_id, status, requested_by_id, assigned_at, responded_at)
            VALUES($1, $2, 'accepted', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (client_id)
            DO UPDATE SET
                trainer_id = EXCLUDED.trainer_id,
                status = 'accepted',
                requested_by_id = NULL,
                assigned_at = CURRENT_TIMESTAMP,
                responded_at = CURRENT_TIMESTAMP
            RETURNING client_id, trainer_id`,
            [clientId, trainerId]
        );
        return {
            success: true,
            clientId: result.rows[0].client_id,
            trainerId: result.rows[0].trainer_id
        };
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
