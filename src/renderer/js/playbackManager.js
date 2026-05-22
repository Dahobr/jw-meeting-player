/**
 * playbackManager.js
 * Handles playback control logic, media state transitions, and media staging.
 */

class PlaybackManager {
    /**
     * @param {Object} app - Reference to the main App instance.
     * @param {Object} ui - Reference to the UIManager instance.
     * @param {Object} ipc - Reference to the IPC client.
     * @param {Object} store - Reference to the PlaylistStore.
     */
    constructor(app, ui, ipc, store) {
        this.app = app;
        this.ui = ui;
        this.ipc = ipc;
        this.store = store;
    }

    /**
     * Prepares media for playback without starting it (staging).
     * @param {Object} item - The media item to stage.
     */
    prepareStagingMedia(item) {
        console.log('[PlaybackManager] prepareStagingMedia:', item.title || item.filename);

        // Clean up any old pending listener before staging new media
        if (this.app.pendingCanPlayListener) {
            this.ui.previewVideo.removeEventListener('canplay', this.app.pendingCanPlayListener);
            this.app.pendingCanPlayListener = null;
        }

        this.app.currentMedia = item;
        this.app.standbyItemId = item.id;
        
        // Record the last item staged for this playlist
        const { currentPlaylistId } = this.store.getState();
        if (currentPlaylistId) {
            this.app.lastStagedItemPerPlaylist[currentPlaylistId] = item.id;
        }
        
        this.ui.ensurePreviewVisible();

        let fullType = item.mediaType || '';
        if (fullType === 'video') fullType = 'video/mp4';
        if (fullType === 'image') fullType = 'image/jpeg';
        
        this.ui.showPreview(fullType, item.filePath, false);
        
        this.app.status = 'staged'; // Use 'staged' for standby
        this.app.isPlayingOnSlave = false; 
        this.app.updateAudioMuteState();
        this.app.updatePlaybackUI();
    }

    /**
     * Normalizes the media type for consistency (e.g., video -> video/mp4).
     * @param {Object} item - The media item.
     * @returns {string} Normalized mime type.
     */
    getNormalizedType(item) {
        let type = item.mediaType || '';
        if (type === 'video') return 'video/mp4';
        if (type === 'image') return 'image/jpeg';
        return type;
    }

    /**
     * Plays the specified media item.
     * @param {Object} item - The media item to play.
     */
    playMedia(item) {
        console.log(`[PlaybackManager] playMedia called for: ${item.title || item.filename}`);
        this.app.currentMedia = item;
        this.app.standbyItemId = null;
        
        const fullType = this.getNormalizedType(item);
        const isVideo = fullType.includes('video');
        const zoomMode = this.ui.zoomModeSelect ? this.ui.zoomModeSelect.value : 'off';
        
        this.ui.ensurePreviewVisible();

        // --- ZOOM INTEGRATION TRIGGER ---
        const useZoom = (zoomMode !== 'off');

        console.log(`[PlaybackManager] Playing ${fullType}. ZoomMode: ${zoomMode}, UseZoom: ${useZoom}`);

        // 1. Show Preview
        this.ui.showPreview(fullType, item.filePath, !useZoom || !isVideo);

        if (useZoom) {
            if (isVideo) {
                // Video: Start in paused state to wait for Zoom
                this.app.status = 'paused';
                this.app.isPlaying = false;
                if (this.app.hasSecondaryDisplay) {
                    this.ipc.loadMedia({ mediaPath: item.filePath, mediaType: fullType, autoPlay: false });
                    this.app.isPlayingOnSlave = false;
                }
            } else {
                // Image: Show immediately, but also trigger Zoom sharing
                this.app.status = 'playing';
                this.app.isPlaying = true;
                if (this.app.hasSecondaryDisplay) {
                    this.ipc.loadMedia({ mediaPath: item.filePath, mediaType: fullType, autoPlay: true });
                    this.app.isPlayingOnSlave = true;
                }
            }
            // Trigger Alt+S via C#
            this.app.triggerZoomSharing(zoomMode);
        } else {
            // Normal behavior without Zoom
            this.app.status = 'playing';
            this.app.isPlaying = true;

            if (this.app.hasSecondaryDisplay) {
                const startTime = this.ui.previewVideo ? this.ui.previewVideo.currentTime : 0;
                this.ipc.loadMedia({ mediaPath: item.filePath, mediaType: fullType, autoPlay: true, startTime: startTime });
                this.app.isPlayingOnSlave = true;
            }

            if (isVideo) {
                this.ui.previewVideo.play().catch(e => {
                    if(e.name !== 'AbortError') console.error('[PlaybackManager] Local play failed:', e);
                });
            }
        }

        this.app.updateAudioMuteState();
        this.app.updatePlaybackUI();
    }

    /**
     * Resumes video playback.
     */
    resumePlayback() {
        if (!this.app.currentMedia || !this.app.currentMedia.mediaType.includes('video')) return;

        this.ui.ensurePreviewVisible();

        this.ui.previewVideo.play().catch(e => { 
            if(e.name !== 'AbortError') console.error('[PlaybackManager] play() failed:', e); 
        });

        if (this.app.hasSecondaryDisplay) {
            this.ipc.playbackControl({ action: 'play' });
            this.app.isPlayingOnSlave = true;
        }

        this.app.status = 'playing';
        this.app.updatePlaybackUI();
        this.app.updateAudioMuteState();
    }

    /**
     * Pauses video playback.
     */
    pausePlayback() {
        if (!this.app.currentMedia || !this.app.currentMedia.mediaType.includes('video')) return;

        this.ui.ensurePreviewVisible();

        this.ui.previewVideo.pause();
        if (this.app.hasSecondaryDisplay) {
            this.ipc.playbackControl({ action: 'pause' });
        }
        this.app.status = 'paused';
        this.updatePlaybackUI();
    }

    /**
     * Stops the media playback.
     * @param {string} [reason='unknown'] - The reason for stopping playback.
     */
    stopMedia(reason = 'unknown') {
        if (this.app.isStopping) return;
        this.app.isStopping = true;

        try {
            console.log(`[PlaybackManager] stopMedia called. Reason: ${reason}`);
            
            const lastMediaId = this.app.currentMedia?.id;
            const { playlists, currentPlaylistId } = this.store.getState();

            if (this.app.pendingCanPlayListener) {
                this.ui.previewVideo.removeEventListener('canplay', this.app.pendingCanPlayListener);
                this.app.pendingCanPlayListener = null;
            }
            
            this.ipc.playbackControl({ action: 'stop' });
            this.app.triggerZoomSharing(false);
            this.app.status = 'stopped';

            this.app.currentMedia = null;
            this.app.isPlayingOnSlave = false;
            
            const isNavigation = reason.includes('navigation');
            
            if (!isNavigation && currentPlaylistId && playlists[currentPlaylistId]) {
                const items = playlists[currentPlaylistId].items;
                if (items.length > 0) {
                    let nextItem = null;
                    
                    if (lastMediaId) {
                        const lastIdx = items.findIndex(i => i.id === lastMediaId);
                        if (lastIdx !== -1) {
                            const nextIdx = (lastIdx + 1) % items.length;
                            nextItem = items[nextIdx];
                        }
                    } else {
                        nextItem = items[0];
                    }

                    if (nextItem) {
                        this.prepareStagingMedia(nextItem);
                        return;
                    }
                }
            }

            this.ui.hidePreview();
            this.updatePlaybackUI();

        } finally {
            this.app.isStopping = false;
        }
    }

    /**
     * Updates the playback UI controls and display state.
     */
    updatePlaybackUI() {
        this.app.updatePlaybackUI();
    }
}
