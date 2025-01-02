import * as alt from 'alt-server';
import * as db from './database.js';
import bcrypt from 'bcryptjs';
import pkg from 'crypto-js';
const { SHA256 } = pkg;

import './characters.js';

alt.on('resourceStart', async () => {
    try {
        await db.initDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
});

alt.on('playerConnect', (player) => {
    alt.emitClient(player, 'auth:showLoginForm');
});

alt.onClient('auth:tryLogin', async (player, loginData) => {
    try {
        const user = await db.findUserByUsername(loginData.username);
        
        if (!user) {
            alt.emitClient(player, 'auth:loginResponse', false, 'User not found');
            return;
        }

        const oldPasswordHash = SHA256(loginData.password).toString();
        
        if (user.password_hash === oldPasswordHash) {
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(loginData.password, salt);
            await db.updateUserPassword(user.id, newPasswordHash);
        } else {
            const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);
            if (!isValidPassword) {
                alt.emitClient(player, 'auth:loginResponse', false, 'Invalid password');
                return;
            }
        }

        player.setMeta('userId', user.id);
        
        await db.updateLastLogin(user.id);
        alt.emitClient(player, 'auth:loginResponse', true, 'Login successful');
        
    } catch (error) {
        console.error('Login error:', error);
        alt.emitClient(player, 'auth:loginResponse', false, 'Server error');
    }
});

alt.onClient('auth:tryRegister', async (player, userData) => {
    try {
        const existingUser = await db.findUserByUsername(userData.username);
        if (existingUser) {
            alt.emitClient(player, 'auth:registerResponse', false, 'Username already exists');
            return;
        }

        const existingEmail = await db.findUserByEmail(userData.email);
        if (existingEmail) {
            alt.emitClient(player, 'auth:registerResponse', false, 'Email already in use');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);

        await db.createUser(userData.username, userData.email, passwordHash);
        
        alt.emitClient(player, 'auth:registerResponse', true, 'Registration successful');
        
    } catch (error) {
        console.error('Registration error:', error);
        alt.emitClient(player, 'auth:registerResponse', false, 'Server error');
    }
}); 