const {pool} = require('../config/database');

class Role{
    static async getRoleByName(name){
        const result = await pool.query(
            `SELECT * FROM roles WHERE name = $1`,
            [name]
        );
        return result.rows[0];
    }

    static async getRoleById(id){
        const result = await pool.query(
            `SELECT * FROM roles WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getAllRoles(){
        const result = await pool.query(
            `SELECT * FROM roles ORDER BY id`
        );
        return result.rows;
    }
}

module.exports = Role;