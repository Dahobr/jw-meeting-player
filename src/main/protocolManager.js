/**
 * @fileoverview ProtocolManager
 * Registers and manages the custom 'media://' protocol to securely serve 
 * local media files to the Electron renderer processes.
 */

const { protocol, session, app, net } = require('electron');
const path = require('path');
const fs = require('fs');

class ProtocolManager {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Register 'media' as a standard and secure protocol before app is ready
        protocol.registerSchemesAsPrivileged([
            { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
        ]);

        this.initialized = true;
        console.log('[ProtocolManager] Privileged schemes registered.');
    }

    initSessions() {
        // Register for the default session
        this.registerMediaProtocol(session.defaultSession);
        
        // Register for our custom session
        this.registerMediaProtocol(session.fromPartition('persist:jw_session'));
        
        // Ensure any future sessions also get the protocol
        app.on('session-created', (ses) => {
            this.registerMediaProtocol(ses);
        });
        
        console.log('[ProtocolManager] Session protocols registered.');
    }

    registerMediaProtocol(ses) {
        const sesName = ses === session.defaultSession ? 'default' : 'persist:jw_session';
        console.log(`[ProtocolManager] Registering 'media' protocol for session: ${sesName}`);

        ses.protocol.registerFileProtocol('media', (request, callback) => {
            let rawPath = request.url.substring(8); // Skip 'media://'
            if (rawPath.startsWith('app/')) {
                rawPath = rawPath.substring(4); // Skip 'app/'
            }
            
            try {
                let decodedPath = decodeURIComponent(rawPath);
                decodedPath = decodedPath.replace(/^\/([a-zA-Z]:)/, '$1'); 
                if (decodedPath.match(/^[a-zA-Z][\\\/]/)) {
                    decodedPath = decodedPath[0] + ':' + decodedPath.substring(1);
                }
                
                let absolutePath = path.normalize(decodedPath);
                
                if (!path.isAbsolute(absolutePath) && !/^[a-zA-Z]:/.test(absolutePath)) {
                    const baseDir = path.join(app.getPath('userData'), '..');
                    absolutePath = path.resolve(baseDir, absolutePath);
                }

                if (fs.existsSync(absolutePath)) {
                    return callback(absolutePath);
                } else {
                    console.warn(`[ProtocolManager] Protocol file NOT FOUND: ${absolutePath}`);
                    const fileName = path.basename(absolutePath);
                    const newPath = path.join(app.getPath('userData'), 'JwMeetingPlayer', 'downloads', fileName);
                    const oldPath = path.join(app.getPath('userData'), 'ElectronPlaylistApp', 'downloads', fileName);
                    
                    if (fs.existsSync(newPath)) return callback(newPath);
                    if (fs.existsSync(oldPath)) return callback(oldPath);
                    
                    return callback(-6);
                }
            } catch (error) {
                console.error('[ProtocolManager] Protocol Handler Error:', error, 'for URL:', request.url);
                return callback(-2);
            }
        });
    }
}

module.exports = new ProtocolManager();
