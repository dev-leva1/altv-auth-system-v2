import mysql from 'mysql2/promise';

const dbConfig = {
    host: '164.132.206.179',
    user: 'gs285169',
    password: 'zXNbGdVDBvqw',
    database: 'gs285169'
};

let connection = null;

export async function initDatabase() {
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS characters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                gender ENUM('male', 'female') NOT NULL,
                age INT NOT NULL,
                ethnicity VARCHAR(50) NOT NULL,
                appearance JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_position JSON,
                FOREIGN KEY (user_id) REFERENCES users(id),
                CHECK (age >= 18 AND age <= 65)
            )
        `);
    } catch (error) {
        throw error;
    }
}

export async function findUserByUsername(username) {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
}

export async function findUserByEmail(email) {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
}

export async function createUser(username, email, passwordHash) {
    try {
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function updateLastLogin(userId) {
    try {
        await connection.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
        return true;
    } catch (error) {
        throw error;
    }
}

export async function getCharactersByUserId(userId) {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM characters WHERE user_id = ?',
            [userId]
        );
        return rows;
    } catch (error) {
        throw error;
    }
}

export async function createCharacter(userId, characterData) {
    try {
        const { firstName, lastName, gender, age, ethnicity, appearance } = characterData;
        
        const [existingChars] = await connection.execute(
            'SELECT COUNT(*) as count FROM characters WHERE user_id = ?',
            [userId]
        );
        
        if (existingChars[0].count >= 3) {
            throw new Error('Maximum number of characters (3) reached');
        }

        const [result] = await connection.execute(
            'INSERT INTO characters (user_id, first_name, last_name, gender, age, ethnicity, appearance) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, firstName, lastName, gender, age, ethnicity, JSON.stringify(appearance)]
        );
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function updateCharacter(characterId, userId, updateData) {
    try {
        const updates = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            updates.push(`${key} = ?`);
            values.push(value);
        }
        
        values.push(characterId, userId);
        
        const [result] = await connection.execute(
            `UPDATE characters SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
}

export async function deleteCharacter(characterId, userId) {
    try {
        const [result] = await connection.execute(
            'DELETE FROM characters WHERE id = ? AND user_id = ?',
            [characterId, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
}

export async function updateCharacterPosition(characterId, position) {
    try {
        await connection.execute(
            'UPDATE characters SET last_position = ? WHERE id = ?',
            [JSON.stringify(position), characterId]
        );
        return true;
    } catch (error) {
        throw error;
    }
}

export async function updateUserPassword(userId, newPasswordHash) {
    try {
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );
        return true;
    } catch (error) {
        throw error;
    }
} 