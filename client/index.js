import * as alt from 'alt-client';
import * as native from 'natives';
import { showCharacterCreation } from './character.js';

let authBrowser = null;
let authCamera = null;

function createAuthCamera() {
    const startPosition = { x: -1095.0, y: -2730.0, z: 700.0 };
    const pointAtPosition = { x: 0.0, y: 0.0, z: 0.0 };
    
    authCamera = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        startPosition.x,
        startPosition.y,
        startPosition.z,
        0.0,
        0.0,
        0.0,
        60.0,
        true,
        0
    );

    native.pointCamAtCoord(authCamera, pointAtPosition.x, pointAtPosition.y, pointAtPosition.z);
    native.setCamActive(authCamera, true);
    native.renderScriptCams(true, false, 0, true, false, 0);

    alt.setInterval(() => {
        if (authCamera) {
            const currentPos = native.getCamCoord(authCamera);
            const angle = native.getGameplayCamRot(0).z + 0.1;
            const newX = startPosition.x + Math.cos(angle) * 10;
            const newY = startPosition.y + Math.sin(angle) * 10;
            
            native.setCamCoord(authCamera, newX, newY, startPosition.z);
            native.pointCamAtCoord(authCamera, pointAtPosition.x, pointAtPosition.y, pointAtPosition.z);
        }
    }, 50);
}

function destroyAuthCamera() {
    if (authCamera) {
        native.renderScriptCams(false, false, 0, true, false, 0);
        native.destroyCam(authCamera, false);
        authCamera = null;
    }
}

function destroyAuthBrowser() {
    if (authBrowser) {
        authBrowser.destroy();
        authBrowser = null;
        destroyAuthCamera();
        alt.showCursor(false);
        alt.toggleGameControls(true);
        native.freezeEntityPosition(alt.Player.local.scriptID, false);
        native.enableAllControlActions(0);
        native.enableAllControlActions(1);
    }
}

alt.onServer('auth:showLoginForm', () => {
    if (!authBrowser) {
        createAuthCamera();
        authBrowser = new alt.WebView('http://resource/client/html/auth.html');
        
        authBrowser.on('auth:tryLogin', (loginData) => {
            alt.emitServer('auth:tryLogin', loginData);
        });

        authBrowser.on('auth:tryRegister', (userData) => {
            alt.emitServer('auth:tryRegister', userData);
        });

        native.freezeEntityPosition(alt.Player.local.scriptID, true);
        native.disableAllControlActions(0);
        native.disableAllControlActions(1);
        
        alt.showCursor(true);
        alt.toggleGameControls(false);
        authBrowser.focus();
    }
});

alt.onServer('auth:loginResponse', (success, message) => {
    if (success) {
        destroyAuthBrowser();
        showCharacterCreation();
    }
    if (authBrowser) {
        authBrowser.emit('auth:loginResponse', success, message);
    }
});

alt.onServer('auth:registerResponse', (success, message) => {
    if (success) {
        destroyAuthBrowser();
    }
    if (authBrowser) {
        authBrowser.emit('auth:registerResponse', success, message);
    }
}); 