/**
 * app.js
 * Renderer Main Entry Point - Orchestrates Store, UI, and IPC.
 */

class App {
    constructor() {
        this.store = window.PlaylistStore;
        this.ui = window.uiManager;
        this.ipc = window.ipcClient;
        
        this.initialized = false;
        this.isStopping = false; // Re-entrancy guard for stopMedia
        this.currentMedia = null;
        this.standbyItemId = null;
        this.isPlaying = false;
        this.status = 'stopped'; // 'stopped', 'staged', 'playing', 'paused'
        this.isDraggingSeeker = false;
        this.hasSecondaryDisplay = false;
        this.wasPlayingBeforeDrag = false;
        this.isPlayingOnSlave = false;
        this.seekerDragEndTime = 0; 
        this.pendingCanPlayListener = null; 
    }

    async init() {
        if (this.initialized) return;

        console.log('[App] Initializing Renderer...');

        this.store.subscribe((state) => this.handleStoreChange(state));
        this.setupUICallbacks();
        this.setupIPCListeners();
        this.setupKeyboardListeners();
        this.setupPreviewListeners();

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
        } catch (e) {
            console.error('[App] Failed to load config:', e);
        }

        try {
            const displayStatus = await this.ipc.requestDisplayStatus();
            this.hasSecondaryDisplay = (displayStatus === 'connected');
            this.ui.updateDisplayStatus(displayStatus);
        } catch (e) {
            console.error('[App] Failed to get display status:', e);
        }

        this.initialized = true;
        console.log('[App] Renderer Initialized.');
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.togglePlayback();
            }
        });
    }

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

    setupUICallbacks() {
        console.log('[App] Setting up UI callbacks...');

        const handleNav = (key) => {
            try { this.stopMedia(`navigation to ${key}`); } catch (e) {}
            this.ipc.navigateSite(key);
        };

        this.ui.btnCantico.onclick = () => handleNav('cantico');
        this.ui.btnReunioes.onclick = () => handleNav('reunioes');
        this.ui.btnVideos.onclick = () => handleNav('videos');
        
        this.ui.btnOpenFolder.onclick = () => this.ipc.openDownloadFolder();
        this.ui.btnOpenYearVerseFolder.onclick = () => window.electronAPI.openYearVerseFolder();
        this.ui.btnOpenZoomAssetsFolder.onclick = () => this.ipc.openZoomAssetsFolder();
        this.ui.btnImportFile.onclick = () => this.handleImport();

        this.ui.btnCreatePlaylist.onclick = () => this.handleCreatePlaylist();
        this.ui.newPlaylistInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleCreatePlaylist();
        });

        this.ui.btnBackToPlaylists.onclick = () => this.ui.switchView('playlists');

        this.ui.onPlaylistSelect = (id) => {
            this.store.setCurrentPlaylistId(id);
            this.ui.switchView('items');
            
            // Auto-standby first item if available
            const state = this.store.getState();
            const playlist = state.playlists[id];
            if (playlist && playlist.items.length > 0 && this.status === 'stopped') {
                this.prepareStagingMedia(playlist.items[0]);
            }
        };

        this.ui.onPlaylistDelete = async (id) => {
            if (confirm('Deseja realmente excluir esta playlist?')) {
                const itemsToDelete = this.store.deletePlaylist(id);
                for (const item of itemsToDelete) {
                    if (item.filePath) await this.ipc.deleteFile(item.filePath);
                }
            }
        };

        this.ui.onPlaylistRename = (id, newName) => this.store.renamePlaylist(id, newName);

        // Item List Interactions
        this.ui.onItemSelect = (item) => {
            console.log('[App] Staging item in preview area.');
            this.prepareStagingMedia(item);
        };
        
        this.ui.onItemPlay = (item) => {
            console.log(`[App] onItemPlay triggered for: ${item.title || item.filename}`);
            if (this.currentMedia && this.currentMedia.id === item.id) {
                // Toggle playback if it's the same item
                this.togglePlayback();
            } else {
                // Otherwise play it
                this.playMedia(item);
            }
        };

        this.ui.onItemRemove = async (playlistId, itemId) => {
            if (confirm('Deseja realmente excluir este arquivo?')) {
                const item = this.store.getItem(playlistId, itemId);
                if (item && item.filePath) await this.ipc.deleteFile(item.filePath);
                this.store.removeItem(playlistId, itemId);
            }
        };
        this.ui.onItemRename = (itemId, newName) => {
            this.store.updateItem(itemId, { title: newName });
        };

        this.ui.btnPlayPause.onclick = () => this.togglePlayback();
        this.ui.volumeSlider.oninput = (e) => this.ipc.playbackControl({ action: 'set-volume', volume: e.target.value / 100 });
        
        if (this.ui.zoomModeSelect) {
            this.ui.zoomModeSelect.onchange = (e) => {
                this.ipc.updateConfig({ zoomMode: e.target.value });
                console.log(`[App] Zoom mode updated to: ${e.target.value}`);
            };
        }

        this.ui.btnStop = document.getElementById('btn-stop');
        if (this.ui.btnStop) this.ui.btnStop.onclick = () => this.stopMedia('manual click');

        if (window.Sortable) {
            new Sortable(this.ui.itemsList, {
                animation: 150,
                onEnd: (evt) => {
                    const { currentPlaylistId } = this.store.getState();
                    this.store.reorderItems(currentPlaylistId, evt.oldIndex, evt.newIndex);
                }
            });
        }
    }

    handleCreatePlaylist() {
        const name = this.ui.newPlaylistInput.value.trim();
        if (name) {
            this.store.addPlaylist(name);
            this.ui.newPlaylistInput.value = '';
        }
    }

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
            this.updatePlaybackUI();
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
            
            this.updatePlaybackUI();
        });

        this.ipc.onDisplayStatus((status) => {
            this.hasSecondaryDisplay = (status === 'connected');
            this.ui.updateDisplayStatus(status);
            this.updateAudioMuteState();
        });

        this.ipc.onPlaybackCommand(({ action }) => {
            // Ignore 'stop' if already stopped, staged, or stopping to prevent feedback loops
            if (action === 'stop') {
                if (this.status === 'stopped' || this.status === 'staged' || this.isStopping) return;
                this.stopMedia('ipc command');
            }
        });

        // Handle Zoom Sharing Ready signal to start playback
        window.electronAPI.onZoomSharingReady(() => {
            console.log('[App] Zoom sharing ready signal received. Starting playback.');
            if (this.pendingCanPlayListener) {
                this.pendingCanPlayListener();
            }
        });
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
    }

    prepareStagingMedia(item) {
        console.log('[App] prepareStagingMedia:', item.title || item.filename);

        // Clean up any old pending listener before staging new media
        if (this.pendingCanPlayListener) {
            this.ui.previewVideo.removeEventListener('canplay', this.pendingCanPlayListener);
            this.pendingCanPlayListener = null;
        }

        this.currentMedia = item;
        this.standbyItemId = item.id;
        
        let fullType = item.mediaType || '';
        if (fullType === 'video') fullType = 'video/mp4';
        if (fullType === 'image') fullType = 'image/jpeg';
        
        this.ui.showPreview(fullType, item.filePath, false);
        
        this.status = 'staged'; // Use 'staged' for standby
        this.isPlayingOnSlave = false; 
        this.updateAudioMuteState();
        this.updatePlaybackUI();
    }

    playMedia(item) {
        console.log(`[App] [PAUSE-LOG] playMedia called for: ${item.title || item.filename}`);
        this.currentMedia = item;
        
        let fullType = item.mediaType || '';
        if (fullType === 'video') fullType = 'video/mp4';
        if (fullType === 'image') fullType = 'image/jpeg';
        
        // Decide if we should wait for Zoom
        const shouldWaitZoom = (this.ui.zoomModeSelect && ['auto', 'script'].includes(this.ui.zoomModeSelect.value));
        
        if (shouldWaitZoom) {
            console.log('[App] [PAUSE-LOG] Zoom Auto/Semi-auto mode detected. Forcing local preview autoPlay=false');
        }
        
        this.ui.showPreview(fullType, item.filePath, !shouldWaitZoom);
        
        this.status = shouldWaitZoom ? 'staged' : 'playing'; 
        this.goLive();
    }

    goLive() {
        if (!this.currentMedia) {
            console.warn('[App] goLive called without currentMedia');
            return;
        }
        
        const isAuto = (this.ui.zoomModeSelect && this.ui.zoomModeSelect.value === 'auto');
        const isSemiAuto = (this.ui.zoomModeSelect && this.ui.zoomModeSelect.value === 'script');
        
        console.log(`[App] goLive. isAuto: ${isAuto}, isSemiAuto: ${isSemiAuto}, Slave: ${this.hasSecondaryDisplay}`);
        
        const item = this.currentMedia;
        let fullType = item.mediaType || '';
        if (fullType === 'video') fullType = 'video/mp4';
        if (fullType === 'image') fullType = 'image/jpeg';

        if (this.hasSecondaryDisplay) {
            this.ipc.loadMedia({ 
                mediaPath: item.filePath, 
                mediaType: fullType, 
                autoPlay: !isAuto, // Auto mode -> wait, Semi/Manual -> play immediately
                startTime: this.ui.previewVideo.currentTime 
            });
            this.isPlayingOnSlave = !isAuto;
        }

        // Trigger Zoom Sharing Start
        this.ipc.updateZoomSharingState(true);

        const startPlayback = () => {
            console.log('[App] >> STARTING PLAYBACK');
            this.ui.previewVideo.play().catch(e => { 
                if(e.name !== 'AbortError') console.error('[App] play() failed:', e); 
            });
            if (this.hasSecondaryDisplay) {
                this.ipc.playbackControl({ action: 'play' });
                this.isPlayingOnSlave = true;
            }
            this.status = 'playing';
            this.updatePlaybackUI();
            this.pendingCanPlayListener = null;
        };

        if (isAuto) {
            console.log('[App] PAUSE ENFORCED (Auto mode). Setting up pending listener.');
            this.ui.previewVideo.pause();
            this.status = 'staged';
            this.pendingCanPlayListener = startPlayback;
        } else if (isSemiAuto) {
            console.log('[App] DELAY ENFORCED (Semi-auto mode). Delaying 3s.');
            this.status = 'staged';
            setTimeout(startPlayback, 3000);
        } else {
            // Normal behavior
            if (this.ui.previewVideo.readyState >= 3) {
                startPlayback();
            } else {
                this.pendingCanPlayListener = startPlayback;
                this.ui.previewVideo.addEventListener('canplay', this.pendingCanPlayListener);
            }
            this.status = 'playing';
        }

        this.standbyItemId = null;
        this.updateAudioMuteState();
        this.updatePlaybackUI();
    }

    updateAudioMuteState() {
        if (this.ui.previewVideo) {
            this.ui.previewVideo.muted = this.hasSecondaryDisplay && this.isPlayingOnSlave;
        }
    }

    togglePlayback() {
        if (this.status === 'stopped') {
            if (this.currentMedia) this.goLive();
            return;
        }

        // If in staged state, always go live
        if (this.status === 'staged') {
            this.goLive();
            return;
        }

        // If currently playing or paused, handle video playback toggle
        const isVideo = this.currentMedia?.mediaType?.includes('video');
        if (isVideo) {
            if (this.ui.previewVideo.paused) {
                this.ui.previewVideo.play().catch(e => { if(e.name !== 'AbortError') console.error(e); });
                this.ipc.playbackControl({ action: 'play' });
                this.status = 'playing';
            } else {
                this.ui.previewVideo.pause();
                this.ipc.playbackControl({ action: 'pause' });
                this.status = 'paused';
            }
            this.updatePlaybackUI();
        } else {
            // It's an image. If it's live, treat toggle as stop.
            this.stopMedia('toggle click on image');
        }
    }

    stopMedia(reason = 'unknown') {
        if (this.isStopping) return;
        this.isStopping = true;

        try {
            console.log(`[App] stopMedia called. Reason: ${reason}`);
            
            // Capture context before resetting
            const lastMediaId = this.currentMedia?.id;
            const { playlists, currentPlaylistId } = this.store.getState();

            // Clean up any pending canplay listener
            if (this.pendingCanPlayListener) {
                this.ui.previewVideo.removeEventListener('canplay', this.pendingCanPlayListener);
                this.pendingCanPlayListener = null;
            }
            
            // 1. Stop actual playback
            this.ipc.playbackControl({ action: 'stop' });
            this.ipc.updateZoomSharingState(false); // Trigger Zoom Sharing Stop
            this.status = 'stopped';
            this.currentMedia = null;
            this.standbyItemId = null;
            this.isPlayingOnSlave = false;
            
            // 2. Handle Auto-Standby logic
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
                        console.log(`[App] Auto-standby for item: ${nextItem.title || nextItem.filename}`);
                        this.prepareStagingMedia(nextItem);
                        return; // Successfully staged, don't hide preview
                    }
                }
            }

            // 3. Fallback: hide preview
            this.ui.hidePreview();
            this.updatePlaybackUI();

        } finally {
            this.isStopping = false;
        }
    }

    updatePlaybackUI() {
        const isStaged = this.status === 'staged';
        const isPlaying = this.status === 'playing';
        const isPaused = this.status === 'paused';
        const isStopped = this.status === 'stopped';
        const isVideo = this.currentMedia?.mediaType?.includes('video');

        // --- Update Status Text ---
        let statusText = 'Parado: Nenhum item';
        if (this.currentMedia) {
            const fileName = this.currentMedia.title || this.currentMedia.filename;
            if (isPlaying) statusText = `Reproduzindo: ${fileName}`;
            else if (isPaused) statusText = `Pausado: ${fileName}`;
            else if (isStaged) statusText = `Preparado: ${fileName}`;
        }
        this.ui.updateCurrentItemInfo(statusText);

        const playIcon = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
        const pauseIcon = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';

        // --- Hide controls if in playlist view ---
        const isPlaylistView = (this.ui.viewPlaylists.style.display !== 'none');
        const transportButtons = document.querySelector('.transport-buttons');
        if (transportButtons) {
            transportButtons.style.visibility = isPlaylistView ? 'hidden' : 'visible';
        }

        // --- Control visibility and appearance of preview controls ---
        let hideAndOverlayPreviewControls = false;
        // Hide and overlay controls if media is stopped
        if (this.status === 'stopped') {
            hideAndOverlayPreviewControls = true;
        } else if (!isVideo && (isPlaying || isStaged)) {
            // For images, we only hide if playing (live). Staged (standby) should show controls if any.
            // Actually, images don't have seeker controls, so let's hide for images always unless we add them.
            hideAndOverlayPreviewControls = true;
        }

        if (this.ui.previewControls) {
            if (hideAndOverlayPreviewControls) {
                this.ui.previewControls.style.visibility = 'hidden';
                this.ui.previewControls.style.pointerEvents = 'none';
            } else {
                this.ui.previewControls.style.visibility = 'visible';
                this.ui.previewControls.style.pointerEvents = 'auto';
            }
        }
        
        if (isVideo) {
            // --- Video Playback ---
            this.ui.btnPlayPause.innerHTML = isPlaying ? pauseIcon : playIcon;
            this.ui.btnPlayPause.style.display = 'inline-flex';
            this.ui.btnPlayPause.title = isPlaying ? 'Pausar' : 'Reproduzir';

            if (isPaused || isStaged) {
                this.ui.btnPlayPause.classList.add('btn-paused-highlight');
                this.ui.btnStop.classList.remove('btn-paused-highlight');  
            } else {
                this.ui.btnPlayPause.classList.remove('btn-paused-highlight');
                this.ui.btnStop.classList.add('btn-paused-highlight');  
            }
        } else {
            // --- Image Playback ---
            if (isStaged) {
                this.ui.btnPlayPause.disabled = false; // Reset state
                this.ui.btnPlayPause.style.opacity = '1';
                this.ui.btnPlayPause.style.cursor = 'pointer';
                this.ui.btnPlayPause.innerHTML = playIcon;
                this.ui.btnPlayPause.style.display = 'inline-flex';
                this.ui.btnPlayPause.title = 'Reproduzir';
                this.ui.btnPlayPause.classList.add('btn-paused-highlight');
                this.ui.btnStop.classList.remove('btn-paused-highlight');  
            } else if (isPlaying) {
                this.ui.btnPlayPause.style.display = 'inline-flex';
                this.ui.btnPlayPause.innerHTML = this.ui.icons.play;
                this.ui.btnPlayPause.title = 'Reproduzir';
                this.ui.btnPlayPause.disabled = true; // Disable interaction
                this.ui.btnPlayPause.style.opacity = '0.5'; // Dim appearance
                this.ui.btnPlayPause.style.cursor = 'default';
                this.ui.btnPlayPause.classList.remove('btn-paused-highlight');
                this.ui.btnStop.classList.add('btn-paused-highlight');  
            } else {
                this.ui.btnPlayPause.disabled = false; // Reset state
                this.ui.btnPlayPause.style.opacity = '1';
                this.ui.btnPlayPause.style.cursor = 'pointer';
                this.ui.btnPlayPause.style.display = 'none';
            }
        }

        console.log(`[UI Update] Status: ${this.status}, isVideo: ${isVideo}`);
        this.ui.updatePlaybackStateUI(this.status, this.currentMedia?.id, this.standbyItemId);
    }

    startBoundsMonitoring() {
        const update = () => this.ipc.updateViewBounds(this.ui.getWebViewBounds());
        window.addEventListener('resize', update);
        setInterval(update, 1000);
        update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
