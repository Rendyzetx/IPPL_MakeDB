import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'make_db_akun'
};

const pool = mysql.createPool(dbConfig);

async function registerUser(email) {
    const [rows] = await pool.query('INSERT INTO users (email) VALUES (?) ON DUPLICATE KEY UPDATE email=email', [email]);
    return rows.insertId;
}

async function logActivity(userId, action) {
    await pool.query('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [userId, action]);
}

export { pool, registerUser, logActivity };
