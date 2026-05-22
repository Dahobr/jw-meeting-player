/**
 * protocolManager.js
 * Manages the custom 'media' protocol registration.
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

        ses.protocol.handle('media', async (request) => {
            // 1. Extract the path from the URL
            let rawPath = request.url.substring(8); // Skip 'media://'
            if (rawPath.startsWith('app/')) {
                rawPath = rawPath.substring(4); // Skip 'app/'
            }
            
            try {
                // 2. Decode URL encoding
                let decodedPath = decodeURIComponent(rawPath);
                
                // 3. Fix Windows drive letters
                decodedPath = decodedPath.replace(/^\/([a-zA-Z]:)/, '$1'); 
                if (decodedPath.match(/^[a-zA-Z][\\\/]/)) {
                    decodedPath = decodedPath[0] + ':' + decodedPath.substring(1);
                }
                
                // 4. Normalize and resolve
                let absolutePath = path.normalize(decodedPath);
                
                if (!path.isAbsolute(absolutePath) && !/^[a-zA-Z]:/.test(absolutePath)) {
                    const baseDir = path.join(app.getPath('userData'), '..');
                    absolutePath = path.resolve(baseDir, absolutePath);
                }

                // 5. Check existence and fallback
                if (fs.existsSync(absolutePath)) {
                    return net.fetch(`file://${absolutePath}`);
                } else {
                    console.warn(`[ProtocolManager] Protocol file NOT FOUND: ${absolutePath}`);
                    const fileName = path.basename(absolutePath);
                    const newPath = path.join(app.getPath('userData'), 'JwMeetingPlayer', 'downloads', fileName);
                    const oldPath = path.join(app.getPath('userData'), 'ElectronPlaylistApp', 'downloads', fileName);
                    
                    if (fs.existsSync(newPath)) {
                        return net.fetch(`file://${newPath}`);
                    }
                    if (fs.existsSync(oldPath)) {
                        return net.fetch(`file://${oldPath}`);
                    }
                    
                    throw new Error('File not found');
                }
            } catch (error) {
                console.error('[ProtocolManager] Protocol Handler Error:', error, 'for URL:', request.url);
                return new Response(null, { status: 404 });
            }
        });
    }
}

module.exports = new ProtocolManager();
