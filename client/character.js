import * as alt from 'alt-client';
import * as native from 'natives';

let characterView = null;
let isCharacterCreationActive = false;
let characterCamera = null;

function createCharacterView() {
    if (characterView) return;
    
    characterView = new alt.WebView('http://resource/client/html/character.html');
    
    characterView.on('character:create', (data) => {
        handleCharacterCreate(data);
    });
    
    characterView.on('character:list', () => {
        handleCharacterList();
    });
    
    characterView.on('character:select', (id) => {
        handleCharacterSelect(id);
    });
    
    characterView.on('character:delete', (id) => {
        handleCharacterDelete(id);
    });
}

export function showCharacterCreation() {
    if (isCharacterCreationActive) return;
    
    createCharacterView();
    alt.showCursor(true);
    alt.toggleGameControls(false);
    characterView.focus();
    isCharacterCreationActive = true;

    const playerPos = alt.Player.local.pos;
    const cameraPos = {
        x: playerPos.x + 1.5,
        y: playerPos.y + 1.5,
        z: playerPos.z + 0.5
    };

    characterCamera = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        cameraPos.x,
        cameraPos.y,
        cameraPos.z,
        0.0,
        0.0,
        0.0,
        60.0,
        true,
        0
    );

    native.setCamCoord(characterCamera, cameraPos.x, cameraPos.y, cameraPos.z, 0);
    native.pointCamAtCoord(characterCamera, playerPos.x, playerPos.y, playerPos.z, 0);
    native.setCamActive(characterCamera, true, 0);
    native.renderScriptCams(true, false, 0, true, false, 0);
}

export function hideCharacterCreation() {
    if (!isCharacterCreationActive) return;
    
    if (characterView) {
        characterView.destroy();
        characterView = null;
    }
    
    alt.showCursor(false);
    alt.toggleGameControls(true);
    isCharacterCreationActive = false;

    if (characterCamera) {
        native.renderScriptCams(false, false, 0, true, false, 0);
        native.destroyCam(characterCamera, false);
        characterCamera = null;
    }
}

async function handleCharacterCreate(characterData) {
    try {
        alt.emitServer('character:create', characterData);
    } catch (error) {
        if (characterView) {
            characterView.emit('character:creation:error', 'Error creating character');
        }
    }
}

function handleCharacterList() {
    alt.emitServer('character:list');
}

function handleCharacterSelect(characterId) {
    alt.emitServer('character:select', characterId);
}

function handleCharacterDelete(characterId) {
    alt.emitServer('character:delete', characterId);
}

alt.onServer('character:creation:success', (response) => {
    if (characterView) {
        characterView.emit('character:creation:success', response);
        characterView.emit('switchToCharacterList');
    }
});

alt.onServer('character:creation:error', (error) => {
    if (characterView) {
        characterView.emit('character:creation:error', error);
    }
});

alt.onServer('character:list:response', (characters) => {
    if (characterView) {
        characterView.emit('character:list:response', characters);
    }
});

alt.onServer('character:select:success', (character) => {
    if (characterView) {
        characterView.emit('character:select:success', character);
        hideCharacterCreation();
    }
});

alt.onServer('character:delete:success', (message) => {
    if (characterView) {
        characterView.emit('character:delete:success', message);
    }
});

alt.on('keyup', (key) => {
    if (key === 27 && isCharacterCreationActive) {
        hideCharacterCreation();
    }
}); 