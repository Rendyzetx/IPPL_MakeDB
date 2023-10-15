import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'make_db_akun'
};

const pool = mysql.createPool(dbConfig);

async function registerUser(googleId, displayName, email, ipAddress) {
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        let userId;
        if (users.length === 0) {
            const [result] = await pool.query("INSERT INTO users (google_id, name, email, last_login) VALUES (?, ?, ?, NOW())", [googleId, displayName, email]);
            userId = result.insertId;
        } else {
            userId = users[0].id;
            await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [userId]);
        }
        
        return userId;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

async function logActivity(userId, email, ip, action) {
    try {
        const logQuery = "INSERT INTO log_User (user_id, email, ip_address, action, waktu) VALUES (?, ?, ?, ?, NOW())";
        await pool.query(logQuery, [userId, email, ip, action]);
    } catch (error) {
        console.error('Error logging activity:', error);
        throw error;
    }
}

// async function getUserById(userId) {
//     const connection = await mysql.createConnection(dbConfig);
//     try {
//         const [rows] = await connection.execute('SELECT * FROM users WHERE google_id = ?', [userId]);
//         return rows[0];
//     } catch (error) {
//         console.error('Error getting user by id:', error);
//         throw error;
//     } finally {
//         await connection.end();
//     }
// }
async function getUserById(userId) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE google_id = ?', [userId]);
        console.log(`User retrieved: ${JSON.stringify(rows[0])}`);
        return rows[0];
    } catch (error) {
        console.error('Error getting user by id:', error);
        throw error;
    } finally {
        await connection.end();
    }
}



export { pool, registerUser, logActivity, getUserById };
