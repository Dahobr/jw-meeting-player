/**
 * app.js
 * Renderer Main Entry Point - Orchestrates Store, UI, and IPC.
 */

class App {
    static PLAY_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
    static PAUSE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';

    constructor(store, ui, ipc) {
        this.store = store;
        this.ui = ui;
        this.ipc = ipc;
        
        this.initialized = false;
        this.isStopping = false;
        this.currentMedia = null;
        this.status = 'stopped';
        this.isDraggingSeeker = false;
        this.hasSecondaryDisplay = false;
        this.wasPlayingBeforeDrag = false;
        this.isPlayingOnSlave = false;
        this.pendingCanPlayListener = null; 
        this.zoomCoords = null;
        this.lastStagedItemPerPlaylist = {};
    }

    /**
     * Displays a custom confirmation modal and returns a promise.
     * 
     * @param {string} message - The confirmation message to display.
     * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise.
     */
    async showCustomConfirm(message) {
        return new Promise((resolve) => {
            const wasWebViewVisible = this.ui.isWebViewVisible();
            this.ui.setWebViewVisibility(false);

            const success = this.ui.showConfirmModal(
                message,
                () => {
                    if (wasWebViewVisible && this.status === "stopped") {
                        this.ui.setWebViewVisibility(true);
                    }
                    resolve(true);
                },
                () => {
                    if (wasWebViewVisible && this.status === "stopped") {
                        this.ui.setWebViewVisibility(true);
                    }
                    resolve(false);
                }
            );

            if (!success) {
                console.error("[App] Modal elements not found");
                resolve(confirm(message));
            }
        });
    }

    /**
     * Initializes the application, setting up listeners, loading initial data, 
     * and configuring the UI.
     * 
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) return;
        this.playbackManager = new PlaybackManager(this, this.ui, this.ipc, this.store);
        this.eventHandler = new EventHandler(this, this.ui, this.ipc, this.store);

        console.log('[App] Initializing Renderer...');

        this.store.subscribe((state) => this.handleStoreChange(state));
        this.eventHandler.init();
        this.setupPreviewListeners();

        // Initialize Tutorial
        try {
            const { default: tutorialManager } = await import('./tutorialManager.js');
            await this.ui.initTutorial(tutorialManager);
        } catch (e) {
            console.error('[App] Failed to load tutorialManager:', e);
        }

        const data = await this.ipc.loadPlaylists();
        this.store.init(data);

        this.ui.switchView('playlists');
        this.status = 'stopped';
        this.updatePlaybackUI();
        this.startBoundsMonitoring();

        // Load config
        try {
            const config = await this.ipc.getConfig();
            if (this.ui.zoomModeSelect) {
                this.ui.zoomModeSelect.value = config.zoomMode || 'auto';
            }
            this.updatePlaybackUI();
        } catch (e) {
            console.error('[App] Failed to load config:', e);
        }

        try {
            const displayStatus = await this.ipc.requestDisplayStatus();
            this.hasSecondaryDisplay = (displayStatus === 'connected');
            this.updatePlaybackUI();
        } catch (e) {
            console.error('[App] Failed to get display status:', e);
        }

        this.initialized = true;
        console.log('[App] Renderer Initialized.');
    }

    /**
     * Sets up event listeners for the preview video and seeker interaction.
     */
    setupPreviewListeners() {
        let lastSeekTime = 0;
        const seekThrottleMs = 100; 

        // 1. Initial Scale Setup & Metadata Loading
        const updateDuration = () => {
            const duration = this.ui.previewVideo.duration;
            console.log('[App] Preview duration:', duration);
            if (duration && !isNaN(duration) && duration > 0) {
                this.ui.updateSeeker(this.ui.previewVideo.currentTime, duration);
            }
        };

        this.ui.previewVideo.onloadedmetadata = updateDuration;
        // Also check immediately in case it's already loaded
        if (this.ui.previewVideo.duration) updateDuration();

        // 2. Dragging Logic
        this.ui.previewSeeker.onmousedown = () => {
            this.isDraggingSeeker = true;
            this.wasPlayingBeforeDrag = (this.status === 'playing');
            if (this.wasPlayingBeforeDrag) {
                this.ui.previewVideo.pause();
                if (this.isPlayingOnSlave) {
                    this.ipc.playbackControl({ action: 'pause' });
                }
            }
        };

        this.ui.previewSeeker.oninput = () => {
            const time = parseFloat(this.ui.previewSeeker.value);
            const duration = this.ui.previewVideo.duration;
            
            // Update labels and seeker background during drag
            this.ui.updateSeekerLabels(time, duration);
            
            // Sync local preview frame
            if (!isNaN(time)) {
                this.ui.previewVideo.currentTime = time;
            }

            if (this.isPlayingOnSlave) {
                const now = Date.now();
                if (now - lastSeekTime > seekThrottleMs) {
                    this.ipc.playbackControl({ action: 'seek', time: time });
                    lastSeekTime = now;
                }
            }
        };

        this.ui.previewSeeker.onmouseup = () => {
            const time = parseFloat(this.ui.previewSeeker.value);
            
            if (!isNaN(time)) {
                this.ui.previewVideo.currentTime = time;
            }
            
            if (this.isPlayingOnSlave) {
                this.ipc.playbackControl({ action: 'seek', time: time });
            }

            this.isDraggingSeeker = false;

            // Restore playback if it was playing before drag
            if (this.wasPlayingBeforeDrag) {
                this.ui.previewVideo.play().catch(e => { if(e.name !== 'AbortError') console.error(e); });
                if (this.isPlayingOnSlave) {
                    this.ipc.playbackControl({ action: 'play' });
                }
            }
        };

        this.ui.previewVideo.onseeked = () => {
            // Log for debugging if needed
            // console.log('[App] Preview seek complete at:', this.ui.previewVideo.currentTime);
        };

        // 3. Periodic Updates (ONLY when not seeking or dragging)
        this.ui.previewVideo.ontimeupdate = () => {
            // Update seeker only if not actively dragging, not seeking, and duration is valid
            // readyState >= 1 means HAVE_METADATA
            // seeking property indicates if the browser is currently seeking
            if (!this.isDraggingSeeker && !this.ui.previewVideo.seeking && this.ui.previewVideo.duration > 0 && !isNaN(this.ui.previewVideo.duration)) {
                const current = this.ui.previewVideo.currentTime;
                const total = this.ui.previewVideo.duration;
                this.ui.updateSeeker(current, total); // Update seeker value based on actual playback
            }
        };

        this.ui.previewVideo.onended = () => {
            console.log('[App] Preview video ended. Auto-returning.');
            this.stopMedia('video ended');
        };
    }

    /**
     * Handles the creation of a new playlist based on UI input.
     */
    handleCreatePlaylist() {
        const name = this.ui.newPlaylistInput.value.trim();
        if (name) {
            this.store.addPlaylist(name);
            this.ui.newPlaylistInput.value = '';
        }
    }

    /**
     * Sets up IPC listeners to handle events from the main process.
     */
    setupIPCListeners() {
        this.ipc.onRequestSaveImage(async (url) => {
            await this.saveBrowserImage(url);
        });

        this.ipc.onDownloadStarted((data) => {
            this.ui.showNotification(`Download iniciado: ${data.filename}`);
            this.ui.renderDownloadItem(data.id, data.filename);
        });

        this.ipc.onDownloadProgress((data) => {
            this.ui.updateDownloadProgress(data.id, data.progress, data.filename);
        });

        this.ipc.onDownloadComplete((data) => {
            const { currentPlaylistId } = this.store.getState();
            this.store.addItem(currentPlaylistId, {
                filename: data.filename,
                filePath: data.filePath,
                mediaType: data.type === '.mp4' ? 'video' : 'image',
                title: data.title || data.filename,
                thumbnailData: data.thumbnailData
            });
        });

        this.ipc.onDownloadError((data) => {
            console.log('[App] Download error received:', data);
            if (this.ui && typeof this.ui.showError === 'function') {
                this.ui.showError(data.id, data.message, data.filename);
            } else {
                console.error('[App] Cannot show error: ui.showError is not available');
            }
        });

        this.ipc.onMediaPlaybackStateChange((isPlaying) => {
            this.isPlaying = isPlaying;
            // Only update status if we aren't in a transition state or stopped
            if (this.status === 'playing' || this.status === 'paused') {
                this.status = isPlaying ? 'playing' : 'paused';
            }
            this.playbackManager.updatePlaybackUI();
        });
        
        this.ipc.onLoadMedia((data) => {
            this.currentMedia = data;
            const isAuto = (this.ui.zoomModeSelect && this.ui.zoomModeSelect.value === 'auto');
            
            // Only force playing status if NOT waiting for Zoom (Auto-mode wait)
            if (!isAuto) {
                this.status = 'playing';
            } else {
                console.log('[App] [PAUSE-LOG] onLoadMedia received but keeping status staged/waiting.');
            }
            
            this.playbackManager.updatePlaybackUI();
        });

        this.ipc.onDisplayStatus((status) => {
            this.hasSecondaryDisplay = (status === 'connected');
            this.playbackManager.updatePlaybackUI();
            this.updateAudioMuteState();
        });

        this.ipc.onPlaybackCommand(({ action }) => {
            // Ignore 'stop' if already stopped, staged, or stopping to prevent feedback loops
            if (action === 'stop') {
                if (this.status === 'stopped' || this.status === 'staged' || this.isStopping) return;
                this.playbackManager.stopMedia('ipc command');
            }
        });

        // Handle Zoom Signals
        window.electronAPI.onZoomProcStdout((data) => {
            if (data.includes('[C#] COORDS:')) {
                const parts = data.split(':')[1].split(',');
                this.zoomCoords = { x: parseInt(parts[0]), y: parseInt(parts[1] ) };
                console.log('[App] >>> SAVED ZOOM COORDS:', this.zoomCoords);
            }
        });

        window.electronAPI.onZoomSharingReady(() => {
            console.log('[App] >>> Zoom sharing READY (STARTED) signal received.');
            if (this.status === 'paused' && this.currentMedia?.mediaType?.includes('video')) {
                console.log('[App] >>> Auto-resuming video playback.');
                this.playbackManager.resumePlayback();
            } else {
                console.log('[App] Zoom signal ignored. Status:', this.status, 'Media:', this.currentMedia?.mediaType);
            }
        });

        window.electronAPI.onZoomSharingFinished(() => {
            console.log('[App] Zoom sharing FINISHED signal received.');
            // This is usually when the window is closed or sharing stops
        });
    }

    /**
     * Resumes video playback after a pause or wait period.
     */
    resumePlayback() {
        this.playbackManager.resumePlayback();
    }

    async saveBrowserImage(url) {
        console.log(`[App] saveBrowserImage triggered for URL: ${url}`);
        try {
            console.log('[App] Fetching image data...');
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);
            
            const blob = await response.blob();
            console.log(`[App] Blob received. Size: ${blob.size}, Type: ${blob.type}`);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                console.log(`[App] Base64 conversion complete. Data length: ${base64data.length}`);
                // Send Base64 data to main process to save
                console.log('[App] Sending save-browser-image IPC to main process');
                this.ipc.saveBrowserImage(base64data, url);
            };
            reader.onerror = (e) => {
                console.error('[App] FileReader error:', e);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('[App] Failed to fetch and save browser image:', error);
            this.ui.showNotification('Erro ao salvar imagem');
        }
    }

    handleStoreChange(state) {
        this.ipc.savePlaylists(state);
        this.ui.renderPlaylists(state.playlists, state.currentPlaylistId);
        if (state.currentPlaylistId && state.playlists[state.currentPlaylistId]) {
            this.ui.renderPlaylistItems(state.currentPlaylistId, state.playlists[state.currentPlaylistId]);
        }
        this.updatePlaybackUI();
    }

    async handleImport() {
        const result = await this.ipc.openFileDialog();
        if (!result) return;
        if (result.newPlaylist) {
            const id = this.store.addPlaylist(result.newPlaylist.name);
            result.newPlaylist.items.forEach(item => {
                delete item.id;
                this.store.addItem(id, item);
            });
            this.ui.onPlaylistSelect(id);
        }
        if (result.newItems) {
            const { currentPlaylistId } = this.store.getState();
            result.newItems.forEach(item => {
                delete item.id;
                this.store.addItem(currentPlaylistId, item);
            });
        }
        this.ui.ensurePreviewVisible();
    }

    prepareStagingMedia(item) {
        this.playbackManager.prepareStagingMedia(item);
    }

    getNormalizedType(item) {
        return this.playbackManager.getNormalizedType(item);
    }

    /**
     * Triggers the Zoom sharing mechanism via IPC.
     *
     * @param {string|boolean} mode - Zoom mode identifier or false to stop.
     */
    triggerZoomSharing(mode) {
        const active = (mode !== false && mode !== 'off');
        console.log(`[App] Triggering Zoom Sharing: active=${active}, mode=${mode}`);
        const args = [];
        if (active && this.zoomCoords) {
            args.push(`--x=${this.zoomCoords.x}`);
            args.push(`--y=${this.zoomCoords.y}`);
        }
        this.ipc.setZoomSharing(active, args);
    }
    // goLive was absorbed into playMedia for simplicity.
    // Removed to avoid confusion.

    /**
     * Updates the preview video audio mute state based on display configuration.
     */
    updateAudioMuteState() {
        if (this.ui.previewVideo) {
            this.ui.previewVideo.muted = this.hasSecondaryDisplay && this.isPlayingOnSlave;
        }
    }

    /**
     * Toggles playback between playing, paused, or stopped.
     */
    togglePlayback() {
        if (this.status === 'stopped' || this.status === 'staged') {
            if (this.currentMedia) this.playbackManager.playMedia(this.currentMedia);
            return;
        }

        // If currently playing or paused, handle video playback toggle
        const isVideo = this.currentMedia?.mediaType?.includes('video');
        if (isVideo) {
            if (this.ui.previewVideo.paused) {
                this.playbackManager.resumePlayback();
            } else {
                this.playbackManager.pausePlayback();
            }
        } else {
            // It's an image. If it's live, treat toggle as stop.
            this.stopMedia('toggle click on image');
        }
    }

    /**
     * Pauses the current video playback.
     */
    pausePlayback() {
        this.playbackManager.pausePlayback();
    }

    /**
     * Stops the current media playback and handles cleanup or auto-standby logic.
     * 
     * @param {string} [reason='unknown'] - The reason for stopping playback.
     */
    stopMedia(reason = 'unknown') {
        this.playbackManager.stopMedia(reason);
    }

    /**
     * Updates the playback bar UI (control buttons and status) 
     * based on the current playback status and media type.
     * 
     * @listens App#handleStoreChange
     * @listens App#stopMedia
     * @listens App#setupPreviewListeners
     * @listens App#onMediaPlaybackStateChange
     * 
     * @context Called whenever the playback status or media state changes, or the UI needs re-rendering.
     */
    updatePlaybackUI() {
        const isStaged = this.status === "staged";
        const isPlaying = this.status === "playing";
        const isPaused = this.status === "paused";
        const isStopped = this.status === "stopped";
        const isVideo = this.currentMedia?.mediaType?.includes("video");

        // Logic for Operation Guide/Overlay is now centralized in UIManager
        // We only call it if we are in a stopped state with no media.
        // Other cases are handled by specific action triggers (ensurePreviewVisible).
        if (isStopped && !this.currentMedia && !this.ui.isWebViewVisible()) {
            this.ui.updateMainOverlay('guide');
        }

        // --- View Logic ---
        const isPlaylistView = this.ui.isPlaylistView();
        let statusText = "";
        
        if (isPlaylistView) {
            statusText = this.hasSecondaryDisplay 
                ? "O segundo monitor: Conectado" 
                : "O segundo monitor: ⚠️ Não detectado";
            this.ui.updateDisplayStatus(this.hasSecondaryDisplay ? "connected" : "waiting");
        } else {
            statusText = "Parado: Nenhum item";
            if (this.currentMedia) {
                const fileName = this.currentMedia.title || this.currentMedia.filename;
                if (isPlaying) statusText = `Reproduzindo: ${fileName}`;
                else if (isPaused) statusText = `Pausado: ${fileName}`;
                else if (isStaged) statusText = `Preparado: ${fileName}`;
            }
            this.ui.updateDisplayStatus("connected");
        }
        
        this.ui.updateCurrentItemInfo(statusText);
        this.ui.setFooterTransportVisibility(!isPlaylistView);
        this.ui.setPreviewControlsOverlayVisibility(!isVideo);

        // --- Calculate Footer UI State ---
        const footerConfig = {
            isVisible: true,
            isEnabled: true,
            icon: isPlaying ? App.PAUSE_ICON : App.PLAY_ICON,
            title: isPlaying ? "Pausar" : (isStaged ? "Reproduzir" : "Retomar"),
            isHighlighted: (isPaused || isStaged),
            isStopHighlighted: !(isPaused || isStaged) && (isPlaying || isStopped)
        };

        if (!isVideo) {
            if (isStaged) {
                footerConfig.title = "Reproduzir";
                footerConfig.isHighlighted = true;
                footerConfig.isStopHighlighted = false;
            } else if (isPlaying) {
                footerConfig.isEnabled = false;
                footerConfig.isHighlighted = false;
                footerConfig.isStopHighlighted = true;
            }
        }
        this.ui.updateFooterPlaybackUI(footerConfig);

        // --- Calculate Playlist Item State ---
        const playlistConfig = {
            statusLabel: (isPlaying || isPaused) ? "NO AR" : (isStaged ? "PREPARADO" : ""),
            statusClass: isStaged ? "staged" : (isPlaying || isPaused ? this.status : ""),
            items: {}
        };

        if (this.currentMedia) {
            playlistConfig.items[this.currentMedia.id] = {
                class: (isPlaying || isPaused) ? "playing" : "standby",
                icon: (isPlaying && isVideo) ? this.ui.icons.pause : (isPlaying ? this.ui.icons.stop : this.ui.icons.play),
                title: (isPlaying && isVideo) ? "Pausar" : (isPaused ? "Retomar" : "Reproduzir")
            };
        }
        this.ui.updatePlaybackStateUI(playlistConfig);
    }

    /**
     * Starts monitoring the window bounds for the webview.
     */
    startBoundsMonitoring() {
        const update = () => this.ipc.updateViewBounds(this.ui.getWebViewBounds());
        window.addEventListener('resize', update);
        setInterval(update, 1000);
        update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App(window.PlaylistStore, window.uiManager, window.ipcClient);
    window.app.init();
});
