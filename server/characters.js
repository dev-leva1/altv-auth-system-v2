import * as alt from 'alt-server';
import * as db from './database.js';

const ALLOWED_ETHNICITIES = ['european', 'asian', 'african', 'latino', 'middleeastern'];

function validateCharacterData(data) {
    try {
        const { firstName, lastName, gender, age, ethnicity, appearance } = data;

        if (!firstName || !lastName || 
            !/^[a-zA-Z]{2,50}$/.test(firstName) || 
            !/^[a-zA-Z]{2,50}$/.test(lastName)) {
            return false;
        }

        if (!gender || !['male', 'female'].includes(gender)) {
            return false;
        }

        if (!age || age < 18 || age > 65) {
            return false;
        }

        if (!ethnicity || !ALLOWED_ETHNICITIES.includes(ethnicity.toLowerCase())) {
            return false;
        }

        if (!appearance || typeof appearance !== 'object') {
            return false;
        }

        const requiredAppearanceFields = ['faceShape', 'skinTone', 'eyeColor', 'hairStyle', 'hairColor'];
        for (const field of requiredAppearanceFields) {
            if (typeof appearance[field] !== 'number' || appearance[field] < 0 || appearance[field] > 100) {
                return false;
            }
        }

        return true;
    } catch (error) {
        return false;
    }
}

alt.onClient('character:create', async (player, characterData) => {
    try {
        const userId = player.getMeta('userId');
        
        if (!userId) {
            alt.emitClient(player, 'character:creation:error', 'Authentication error');
            return;
        }

        if (!validateCharacterData(characterData)) {
            alt.emitClient(player, 'character:creation:error', 'Invalid character data');
            return;
        }

        const newCharId = await db.createCharacter(userId, characterData);
        
        alt.emitClient(player, 'character:creation:success', {
            message: 'Character created successfully!',
            characterId: newCharId
        });

        const characters = await db.getCharactersByUserId(userId);
        alt.emitClient(player, 'character:list:response', characters);
    } catch (error) {
        if (error.message === 'Maximum number of characters (3) reached') {
            alt.emitClient(player, 'character:creation:error', 'Character limit reached (3)');
        } else {
            alt.emitClient(player, 'character:creation:error', 'Error creating character');
        }
    }
});

alt.onClient('character:list', async (player) => {
    try {
        const userId = player.getMeta('userId');
        const characters = await db.getCharactersByUserId(userId);
        alt.emitClient(player, 'character:list:response', characters);
    } catch (error) {
        alt.emitClient(player, 'character:list:error', 'Error fetching character list');
    }
});

alt.onClient('character:select', async (player, characterId) => {
    try {
        const userId = player.getMeta('userId');
        const characters = await db.getCharactersByUserId(userId);
        const character = characters.find(c => c.id === characterId);

        if (!character) {
            alt.emitClient(player, 'character:select:error', 'Character not found');
            return;
        }

        player.setMeta('characterId', character.id);
        player.setMeta('firstName', character.first_name);
        player.setMeta('lastName', character.last_name);

        if (character.last_position) {
            const pos = JSON.parse(character.last_position);
            player.pos = new alt.Vector3(pos.x, pos.y, pos.z);
        } else {
            player.pos = new alt.Vector3(-1037.7359619140625, -2737.775390625, 13.776507377624512);
        }

        alt.emitClient(player, 'character:select:success', character);
    } catch (error) {
        alt.emitClient(player, 'character:select:error', 'Error selecting character');
    }
});

alt.onClient('character:delete', async (player, characterId) => {
    try {
        const userId = player.getMeta('userId');
        
        if (!userId) {
            alt.emitClient(player, 'character:delete:error', 'Authentication error');
            return;
        }

        const characters = await db.getCharactersByUserId(userId);
        const character = characters.find(c => c.id === characterId);

        if (!character) {
            alt.emitClient(player, 'character:delete:error', 'Character not found');
            return;
        }

        const success = await db.deleteCharacter(characterId, userId);
        
        if (success) {
            alt.emitClient(player, 'character:delete:success', 'Character deleted successfully');
            
            const updatedCharacters = await db.getCharactersByUserId(userId);
            alt.emitClient(player, 'character:list:response', updatedCharacters);
        } else {
            alt.emitClient(player, 'character:delete:error', 'Error deleting character');
        }
    } catch (error) {
        alt.emitClient(player, 'character:delete:error', 'Error deleting character');
    }
});

alt.on('playerDisconnect', async (player) => {
    try {
        const characterId = player.getMeta('characterId');
        if (characterId) {
            const position = {
                x: player.pos.x,
                y: player.pos.y,
                z: player.pos.z
            };
            await db.updateCharacterPosition(characterId, position);
        }
    } catch (error) {
        console.error('Error saving character position:', error);
    }
}); 