/**
 * App
 * Renderer Main Entry Point - Orchestrates Store, UI, and IPC.
 * This class acts as a central controller for the renderer process.
 */
class App {
    static PLAY_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
    static PAUSE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';

    /**
     * Initializes the App instance.
     * @param {Object} store - The playlist store instance.
     * @param {UIManager} ui - The UI Manager instance.
     * @param {IPCClient} ipc - The IPC Client instance.
     */
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
        this.hasPlayedAnything = false;
        this.lastPlaylistId = null;
    }

    /**
     * Shows a custom confirmation modal, temporarily hiding the WebView if visible.
     * @param {string} message - The message to display in the modal.
     * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
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
     * Handles the application close confirmation logic.
     * Displays a reminder to create a new playlist if conditions are met.
     */
    async handleConfirmClose() {
        const { playlists, currentPlaylistId } = this.store.getState();
        const playlistIds = Object.keys(playlists);
        
        // Sort IDs by timestamp to ensure we get the latest one
        const sortedIds = playlistIds.sort((a, b) => {
            const timeA = parseInt(a.replace('playlist-', ''));
            const timeB = parseInt(b.replace('playlist-', ''));
            return timeA - timeB;
        });
        const lastPlaylistId = sortedIds[sortedIds.length - 1];
        
        // Reminder condition:
        // - If played anything: Remind only if viewing the latest playlist.
        // - If NOT played anything: Remind if there is 1 or fewer playlists.
        const shouldRemind = this.hasPlayedAnything 
            ? (currentPlaylistId === lastPlaylistId)
            : (playlistIds.length <= 1);

        if (shouldRemind) {
            const confirmed = await this.showCustomConfirm('Deseja criar uma nova playlist para a próxima reunião antes de sair?');
            if (confirmed) {
                this.ui.switchView('playlists');
                if (this.ui.newPlaylistInput) this.ui.newPlaylistInput.focus();
            } else {
                this.ipc.readyToClose();
            }
        } else {
            this.ipc.readyToClose();
        }
    }

    /**
     * Initializes the application, setting up managers, listeners, and loading initial data.
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
        this.setupIPCListeners();

        const data = await this.ipc.loadPlaylists();
        this.store.init(data);

        const initialState = this.store.getState();
        this.lastPlaylistId = initialState.currentPlaylistId;
        this.ipc.setActivePlaylist(this.lastPlaylistId);

        this.ui.switchView('playlists');
        this.status = 'stopped';
        this.updatePlaybackUI();
        this.startBoundsMonitoring();

        this.ipc.onConfirmClose(() => {
            this.handleConfirmClose();
        });


        uiManager.onPrevious = () => {
            const { playlists, currentPlaylistId } = app.store.getState();
            const playlist = playlists[currentPlaylistId];
            if (playlist && playlist.items.length > 0) {
                const currentIdx = playlist.items.findIndex(i => i.id === app.currentMedia?.id);
                const prevIdx = (currentIdx - 1 + playlist.items.length) % playlist.items.length;
                const item = playlist.items[prevIdx];

                if (app.status === 'staged') {
                    app.playbackManager.prepareStagingMedia(item);
                } else {
                    app.playbackManager.playMedia(item);
                }
            }
        };

        uiManager.onNext = () => {
            const { playlists, currentPlaylistId } = app.store.getState();
            const playlist = playlists[currentPlaylistId];
            if (playlist && playlist.items.length > 0) {
                const currentIdx = playlist.items.findIndex(i => i.id === app.currentMedia?.id);
                const nextIdx = (currentIdx + 1) % playlist.items.length;
                const item = playlist.items[nextIdx];

                if (app.status === 'staged') {
                    app.playbackManager.prepareStagingMedia(item);
                } else {
                    app.playbackManager.playMedia(item);
                }
            }
        };

        try {
            const config = await this.ipc.getConfig();
            this.ui.setZoomMode(config.zoomMode);
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
     * Sets up event listeners for the preview media player and seeker controls.
     * Handles seek synchronization between local preview and secondary display playback.
     */
    setupPreviewListeners() {
        let lastSeekTime = 0;
        const seekThrottleMs = 100; 

        const updateDuration = () => {
            const duration = this.ui.previewVideo.duration;
            if (duration && !isNaN(duration) && duration > 0) {
                this.ui.updateSeeker(this.ui.previewVideo.currentTime, duration);
            }
        };

        this.ui.previewVideo.onloadedmetadata = updateDuration;
        if (this.ui.previewVideo.duration) updateDuration();

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
            this.ui.updateSeekerLabels(time, duration);
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

            if (this.wasPlayingBeforeDrag) {
                this.ui.previewVideo.play().catch(e => { if(e.name !== 'AbortError') console.error(e); });
                if (this.isPlayingOnSlave) {
                    this.ipc.playbackControl({ action: 'play' });
                }
            }
        };

        this.ui.previewVideo.ontimeupdate = () => {
            if (!this.isDraggingSeeker && !this.ui.previewVideo.seeking && this.ui.previewVideo.duration > 0 && !isNaN(this.ui.previewVideo.duration)) {
                const current = this.ui.previewVideo.currentTime;
                const total = this.ui.previewVideo.duration;
                this.ui.updateSeeker(current, total);
            }
        };

        this.ui.previewVideo.onended = () => {
            this.stopMedia('video ended');
        };
    }

    /**
     * Handles the creation of a new playlist from the UI input.
     */
    handleCreatePlaylist() {
        const name = this.ui.newPlaylistInput.value.trim();
        if (name) {
            this.store.addPlaylist(name);
            this.ui.newPlaylistInput.value = '';
        }
    }

    /**
     * Sets up listeners for IPC events from the main process.
     * Handles downloads, display status changes, and external playback commands.
     */
    setupIPCListeners() {
        this.ipc.onRequestSaveImage(async (url) => {
            await this.saveBrowserImage(url);
        });

        this.ipc.onDownloadStarted((data) => {
            this.ui.showNotification(`Download iniciado: ${data.filename}`);
            this.ui.playlistRenderer.renderDownloadItem(data.id, data.filename, this.ui.itemsList);

            // Check if the item already exists in the current playlist
            const state = this.store.getState();
            const playlist = state.playlists[state.currentPlaylistId];
            const existingItem = playlist ? playlist.items.find(i => i.id === data.id) : null;

            if (existingItem) {
                // Update existing item status
                this.store.updateItem(data.id, {
                    status: 'downloading',
                    progress: 0
                });
            } else {
                // Add as new item
                this.store.addItem(state.currentPlaylistId, {
                    id: data.id,
                    filename: data.filename,
                    title: data.filename,
                    status: 'downloading',
                    progress: 0
                });
            }
        });

        this.ipc.onDownloadProgress((data) => {
            // Check if the item already exists
            const state = this.store.getState();
            const playlist = state.playlists[state.currentPlaylistId];
            const existingItem = playlist ? playlist.items.find(i => i.id === data.id) : null;

            if (existingItem) {
                this.store.updateItem(data.id, { progress: data.progress });
            }
        });

        this.ipc.onDownloadComplete((data) => {
            console.log("[DEBUG] Download Complete, ID:", data.id);
            const state = this.store.getState();
            const playlist = state.playlists[state.currentPlaylistId];
            if (playlist) {
                console.log("[DEBUG] Playlist items IDs:", playlist.items.map(i => i.id));
            }

            // Remove the download item UI
            this.ui.playlistRenderer.removeDownloadItem(data.id, this.ui.itemsList);

            // Check if the item already exists in the current playlist
            const existingItem = playlist ? playlist.items.find(i => i.id === data.id) : null;

            if (existingItem) {
                console.log("[DEBUG] Updating existing item:", data.id);
                // Update existing item
                this.store.updateItem(data.id, {
                    status: 'completed',
                    filePath: data.filePath,
                    mediaType: data.type === '.mp4' ? 'video' : 'image',
                    title: data.title || data.filename,
                    thumbnailData: data.thumbnailData,
                    sourceUrl: data.sourceUrl
                });
            } else {
                console.log("[DEBUG] Item not found, adding as new:", data.id);
                // Add as new item
                this.store.addItem(state.currentPlaylistId, {
                    id: data.id,
                    filename: data.filename,
                    filePath: data.filePath,
                    mediaType: data.type === '.mp4' ? 'video' : 'image',
                    title: data.title || data.filename,
                    status: 'completed',
                    progress: 100,
                    sourceUrl: data.sourceUrl
                });
            }
        });

        this.ipc.onDownloadError((data) => {
            if (this.ui && typeof this.ui.showError === 'function') {
                this.ui.showError(data.id, data.message, data.filename);
            }
        });

        this.ipc.onPlaylistImported((playlist) => {
            this.ui.showNotification(`Playlist "${playlist.name}" importada.`);
            this.store.addPlaylistFromData(playlist);
            
            // Set current playlist and switch view
            this.store.setCurrentPlaylistId(playlist.id);
            this.ui.switchView('items');
            this.updatePlaybackUI();

            // Trigger background download for videos missing local filePath
            playlist.items.forEach(item => {
                if (item.mediaType === 'video' && !item.filePath && item.sourceUrl) {
                    console.log(`[App] Triggering background download for: ${item.title}`);
                    
                    // Set status to downloading so UI can show progress
                    this.store.updateItem(item.id, { status: 'downloading', progress: 0 });
                    
                    this.ipc.downloadURL(item.sourceUrl, item.id);
                }
            });
        });

        this.ipc.onShareResult((result) => {
            if (result.success) {
                this.ui.showNotification("Playlist copiada! No WhatsApp, escolha o contato e pressione Ctrl+V para enviar.");
                // Also show a standard alert for better visibility if needed, but the task says notification/alert
                alert("Playlist copiada! No WhatsApp, escolha o contato e pressione Ctrl+V para enviar.");
            } else {
                this.ui.showNotification("Erro ao compartilhar playlist: " + result.error);
            }
        });

        this.ipc.onMediaPlaybackStateChange((isPlaying) => {
            this.isPlaying = isPlaying;
            if (this.status === 'playing' || this.status === 'paused') {
                this.status = isPlaying ? 'playing' : 'paused';
            }
            this.playbackManager.updatePlaybackUI();
        });
        
        this.ipc.onLoadMedia((data) => {
            this.currentMedia = data;
            const isAuto = (this.ui.zoomModeSelect && this.ui.zoomModeSelect.value === 'auto');
            
            if (!isAuto) {
                this.status = 'playing';
            }
            this.playbackManager.updatePlaybackUI();
        });

        this.ipc.onDisplayStatus((status) => {
            this.hasSecondaryDisplay = (status === 'connected');
            this.playbackManager.updatePlaybackUI();
            this.updateAudioMuteState();
        });

        this.ipc.onPlaybackCommand(({ action }) => {
            if (action === 'stop') {
                if (this.status === 'stopped' || this.status === 'staged' || this.isStopping) return;
                this.playbackManager.stopMedia('ipc command');
            }
        });

        window.electronAPI.onZoomProcStdout((data) => {
            if (data.includes('[C#] COORDS:')) {
                const parts = data.split(':')[1].split(',');
                this.zoomCoords = { x: parseInt(parts[0]), y: parseInt(parts[1] ) };
            }
        });

        window.electronAPI.onZoomSharingReady(() => {
            if (this.status === 'paused' && this.currentMedia?.mediaType?.includes('video')) {
                this.playbackManager.resumePlayback();
            }
        });
    }

    /**
     * Resumes playback via PlaybackManager.
     */
    resumePlayback() {
        this.playbackManager.resumePlayback();
    }

    /**
     * Ensures an active playlist exists, creating a default one if necessary.
     * @returns {string} The active playlist ID.
     */
    _ensureActivePlaylist() {
        const { currentPlaylistId, playlists } = this.store.getState();
        if (currentPlaylistId && playlists[currentPlaylistId]) {
            return currentPlaylistId;
        }

        // Check if any playlist exists
        const playlistIds = Object.keys(playlists);
        if (playlistIds.length > 0) {
            const firstId = playlistIds[0];
            this.store.setCurrentPlaylistId(firstId);
            return firstId;
        }

        // Create a default playlist
        const newId = this.store.addPlaylist('Minha Playlist');
        this.store.setCurrentPlaylistId(newId);
        return newId;
    }

    /**
     * Fetches an image from a URL and saves it via IPC.
     * @param {string} url - The URL of the image to save.
     */
    async saveBrowserImage(url) {
        try {
            // Ensure we have a playlist to save to
            this._ensureActivePlaylist();

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);
            
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                this.ipc.saveBrowserImage(base64data, url);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('[App] Failed to fetch and save browser image:', error);
            this.ui.showNotification('Erro ao salvar imagem');
        }
    }

    /**
     * Handles changes in the playlist store state.
     * Persists data and triggers UI updates.
     * @param {Object} state - The new store state.
     */
    handleStoreChange(state) {
        if (this.lastPlaylistId !== state.currentPlaylistId) {
            this.lastPlaylistId = state.currentPlaylistId;
            this.ipc.setActivePlaylist(state.currentPlaylistId);
        }
        this.ipc.savePlaylists(state);
        this.ui.playlistRenderer.render(state.playlists, state.currentPlaylistId, this.ui.playlistList, {
            onPlaylistSelect: (id) => this.ui.onPlaylistSelect(id),
            onPlaylistDelete: (id) => this.ui.onPlaylistDelete(id),
            onPlaylistRename: (id, name) => this.ui.onPlaylistRename(id, name),
            togglePlaylistEdit: (id, show) => this.ui.playlistRenderer.togglePlaylistEdit(id, show)
        });
        if (state.currentPlaylistId && state.playlists[state.currentPlaylistId]) {
            this.ui.playlistRenderer.renderItems(
                state.currentPlaylistId, 
                state.playlists[state.currentPlaylistId], 
                this.ui.itemsList, 
                this.ui.currentPlaylistTitle,
                {
                    onItemSelect: (item) => this.ui.onItemSelect(item),
                    onItemPlay: (item) => this.ui.onItemPlay(item),
                    onItemRemove: (playlistId, itemId) => this.ui.onItemRemove(playlistId, itemId),
                    onItemRename: (itemId, newName) => this.ui.onItemRename(itemId, newName),
                    toggleItemEdit: (id, show) => this.ui.playlistRenderer.toggleItemEdit(id, show)
                }
            );
        }
        this.updatePlaybackUI();
    }

    /**
     * Handles file/playlist import via a file dialog.
     */
    async handleImport() {
        // Ensure we have an active playlist before importing individual items
        const currentPlaylistId = this._ensureActivePlaylist();

        const result = await this.ipc.openFileDialog();
        if (!result) return;
        
        // Process playlist import (for legacy .jwlplaylist or manual results)
        // Note: .jwmp is now handled via onPlaylistImported IPC event triggered from main
        if (result.newPlaylist) {
            const id = this.store.addPlaylist(result.newPlaylist.name);
            result.newPlaylist.items.forEach(item => {
                this._addOrUpdateItem(id, item);
            });
            this.ui.onPlaylistSelect(id);
        }

        // Process individual item import
        if (result.newItems && result.newItems.length > 0) {
            result.newItems.forEach(item => {
                this._addOrUpdateItem(currentPlaylistId, item);
            });
        }
        this.ui.ensurePreviewVisible();
    }

    // Helper method to handle deduplication
    _addOrUpdateItem(playlistId, item) {
        const state = this.store.getState();
        const playlist = state.playlists[playlistId];
        
        // Find existing item by ID or sourceUrl
        const existingItem = playlist ? playlist.items.find(i => 
            (item.id && i.id === item.id) || (item.sourceUrl && i.sourceUrl === item.sourceUrl)
        ) : null;

        if (existingItem) {
            this.store.updateItem(existingItem.id, item);
        } else {
            // Add as a new item if not found
            const newItem = { ...item };
            delete newItem.id; 
            this.store.addItem(playlistId, newItem);
        }
    }

    /**
     * Prepares a media item for staging.
     * @param {Object} item - The media item to stage.
     */
    prepareStagingMedia(item) {
        this.playbackManager.prepareStagingMedia(item);
    }

    /**
     * Normalizes a media type string.
     * @param {Object} item - The media item.
     * @returns {string} The normalized type.
     */
    getNormalizedType(item) {
        return this.playbackManager.getNormalizedType(item);
    }

    /**
     * Triggers Zoom screen sharing control.
     * @param {string|boolean} mode - The sharing mode or false to turn off.
     */
    triggerZoomSharing(mode) {
        const active = (mode !== false && mode !== 'off');
        const args = [];
        if (active && this.zoomCoords) {
            args.push(`--x=${this.zoomCoords.x}`);
            args.push(`--y=${this.zoomCoords.y}`);
        }
        this.ipc.setZoomSharing(active, args);
    }

    /**
     * Updates the mute state of the local preview player based on secondary display status.
     */
    updateAudioMuteState() {
        if (this.ui.previewVideo) {
            this.ui.previewVideo.muted = this.hasSecondaryDisplay && this.isPlayingOnSlave;
        }
    }

    /**
     * Toggles between play and pause/stop states.
     */
    togglePlayback() {
        if (this.status === 'stopped' || this.status === 'staged') {
            if (this.currentMedia) this.playbackManager.playMedia(this.currentMedia);
            return;
        }

        const isVideo = this.currentMedia?.mediaType?.includes('video');
        if (isVideo) {
            if (this.ui.previewVideo.paused) {
                this.playbackManager.resumePlayback();
            } else {
                this.playbackManager.pausePlayback();
            }
        } else {
            this.stopMedia('toggle click on image');
        }
    }

    /**
     * Pauses video playback.
     */
    pausePlayback() {
        this.playbackManager.pausePlayback();
    }

    /**
     * Stops media playback.
     * @param {string} reason - The reason for stopping.
     */
    stopMedia(reason = 'unknown') {
        this.playbackManager.stopMedia(reason);
    }

    /**
     * Triggers a full UI update based on the current application state.
     */
    updatePlaybackUI() {
        const state = {
            status: this.status,
            currentMedia: this.currentMedia,
            isVideo: this.currentMedia?.mediaType?.includes("video"),
            isPlaylistView: this.ui.isPlaylistView(),
            hasSecondaryDisplay: this.hasSecondaryDisplay,
            isWebViewVisible: this.ui.isWebViewVisible()
        };

        this.ui.renderAllPlaybackUI(state);
    }

    /**
     * Starts periodic monitoring of WebView bounds for IPC updates.
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
