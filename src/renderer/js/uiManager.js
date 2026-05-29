/**
 * uiManager.js
 * Renderer UI Manager - Handles DOM manipulation and templates.
 */

class UIManager {
    /**
     * Initializes the UIManager, setting up references to DOM elements and global event listeners.
     */
    constructor() {
        this.router = new ViewRouter();
        // Elements
        this.btnCantico = DomUtils.get('btn-cantico');
        this.btnReunioes = DomUtils.get('btn-reunioes');
        this.btnVideos = DomUtils.get('btn-videos');
        this.btnEsbocos = DomUtils.get('btn-esbocos');
        this.btnOpenFolder = DomUtils.get('btn-open-folder');
        this.btnOpenYearVerseFolder = DomUtils.get('btn-open-year-verse-folder');
        this.btnCreatePlaylist = DomUtils.get('btn-create-playlist');
        this.btnBackToPlaylists = DomUtils.get('btn-back-to-playlists');
        this.btnImportFile = DomUtils.get('btn-import-file');
        this.zoomModeSelect = DomUtils.get('zoom-mode-select');
        
        this.btnFooterPlayPause = DomUtils.get('btn-footer-play-pause');
        this.btnFooterPrev = DomUtils.get('btn-footer-prev');
        this.btnFooterNext = DomUtils.get('btn-footer-next');

        // Add click listeners
        this.btnFooterPrev.onclick = () => this.onPrevious();
        this.btnFooterNext.onclick = () => this.onNext();
        
        this.newPlaylistInput = DomUtils.get('new-playlist-name');
        this.playlistList = DomUtils.get('playlist-list');
        this.itemsList = DomUtils.get('playlist-items-ul');
        this.currentPlaylistTitle = DomUtils.get('current-playlist-title');
        this.currentItemInfo = DomUtils.get('current-item-info');
        
        this.viewPlaylists = DomUtils.get('view-playlists');
        this.viewItems = DomUtils.get('view-items');
        this.webviewContainer = DomUtils.query('.webview-container');

        // Preview Elements
        this.previewArea = DomUtils.get('preview-area');
        this.previewVideo = DomUtils.get('preview-video');
        this.previewImage = DomUtils.get('preview-image');
        this.previewSeeker = DomUtils.get('preview-seeker');
        this.previewControls = DomUtils.get('preview-controls-container');
        this.previewControlsOverlay = DomUtils.get('preview-controls-overlay');
        this.previewTimeCurrent = DomUtils.get('preview-time-current');
        this.previewTimeTotal = DomUtils.get('preview-time-total');
        this.stateLabel = DomUtils.get('preview-state-label');

        // Help Elements
        this.helpView = DomUtils.get('help-view');
        this.helpContainer = DomUtils.get('help-html-container');

        // Common SVG Icons
        this.icons = {
            play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
            pause: '<svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
            stop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>',
            edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
            delete: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
        };

        this.btnMenu = DomUtils.get('btn-menu');
        this.headerMenu = DomUtils.get('header-menu');
        this.btnMenuTutorial = DomUtils.get('btn-menu-tutorial');
        this.btnMenuYear = DomUtils.get('btn-menu-year');
        this.btnMenuDownloads = DomUtils.get('btn-menu-downloads');
        this.btnMenuAbout = DomUtils.get('btn-menu-about');

        // Global click listener to close dropdowns
        document.addEventListener('click', (e) => {
            if (!this.btnMenu.contains(e.target)) {
                if (this.headerMenu.classList.contains('show')) {
                    this.headerMenu.classList.remove('show');
                }
            }
            DomUtils.queryAll('.item-dropdown.show').forEach(d => d.classList.remove('show'));
        });

        this.btnMenu.onclick = (e) => {
            e.stopPropagation();
            this.headerMenu.classList.toggle('show');
        };

        this.previewMediaWrapper = DomUtils.query('.preview-media-wrapper');
        this.appVersionSpan = DomUtils.get('app-version');

        this.playlistRenderer = new PlaylistListRenderer(this.playlistList);

        this.initAppVersion();
    }

    async initAppVersion() {
        if (this.appVersionSpan && window.electronAPI && window.electronAPI.getAppVersion) {
            try {
                const version = await window.electronAPI.getAppVersion();
                this.appVersionSpan.textContent = `v${version}`;
            } catch (err) {
                console.error('[UI] Failed to fetch app version:', err);
                this.appVersionSpan.textContent = '';
            }
        }
    }

    /**
     * Centralized method to manage main content overlays.
     * @param {string} mode - The view mode to display: 'preview', 'help', or 'webview'.
     */
    updateMainOverlay(mode) {
        this.router.updateMainOverlay(mode);
    }

    /**
     * Resets the UI to show the preview area, hiding all overlays.
     */
    ensurePreviewVisible() {
        if (this.router.isPlaylistView()) return;
        this.router.updateMainOverlay('preview');
    }

    /**
     * Checks if the playlist view is currently displayed.
     */
    isPlaylistView() {
        return this.router.isPlaylistView();
    }

    /**
     * Switches the UI view between 'playlists' and 'items'.
     */
    switchView(viewName) {
        this.router.switchView(viewName);
    }

    /**
     * Displays a media item in the preview area.
     */
    showPreview(type, filePath, autoPlay = true) {
        console.log(`[UI] showPreview: ${type} -> ${filePath} (AutoPlay: ${autoPlay})`);
        
        this.router.updateMainOverlay('preview');

        const isVideo = type.includes('video') || filePath.toLowerCase().endsWith('.mp4');
        
        const normalizedPath = filePath.replace(/\\/g, '/');
        const safeUrl = `media://app/${normalizedPath}`;
        
        if (isVideo) {
            const newSrc = safeUrl;
            if (this.previewVideo.src !== newSrc) {
                this.previewVideo.onerror = (e) => console.error('[UI] Preview video error:', e, this.previewVideo.error);
                this.previewVideo.src = newSrc;
                this.previewSeeker.value = 0;
                this.previewSeeker.style.backgroundSize = `0% 100%`;
                this.previewVideo.load();
            }
            this.previewVideo.style.display = 'block';
            this.previewImage.style.display = 'none';
            if (autoPlay) {
                this.previewVideo.play().catch(e => {
                    if (e.name !== 'AbortError') console.warn('[UI] Preview auto-play failed:', e);
                });
            } else {
                this.previewVideo.pause();
            }
        } else {
            this.previewImage.onerror = (e) => console.error('[UI] Preview image error:', e);
            this.previewImage.src = safeUrl;
            this.previewImage.style.display = 'block';
            this.previewVideo.style.display = 'none';
            this.previewVideo.pause();
            this.previewVideo.removeAttribute('src');
            this.previewVideo.load();
        }
    }

    /**
     * Hides the preview area and restores the main content view.
     */
    hidePreview() {
        this.router.hidePreview();
        this.previewVideo.pause();

        if (this.stateLabel) {
            this.stateLabel.textContent = '';
            this.stateLabel.className = 'state-label';
        }
        
        this.previewVideo.removeAttribute('src');
        this.previewVideo.load();
        
        this.previewImage.removeAttribute('src');
    }

    /**
     * Displays help content in the UI.
     */
    showHelp(html) {
        this.router.showHelp(html);
    }

    /**
     * Hides the help view.
     */
    hideHelp() {
        this.router.hideHelp();
    }

    // UI Constants
    static PLAY_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
    static PAUSE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';

    /**
     * Updates the visual state of the footer playback buttons.
     */
    updateFooterPlaybackUI(config, isVideo) {
        const { isVisible, isEnabled, icon, title, isHighlighted, isStopHighlighted, isStopEnabled } = config;
        
        let finalIcon = icon;
        let finalEnabled = isEnabled;
        let finalTitle = title;
        let finalHighlighted = isHighlighted;

        if (!isVideo && isEnabled === false) {
            finalIcon = this.icons.play;
            finalEnabled = false;
            finalTitle = "Reproduzindo";
            finalHighlighted = false;
        }
        
        this.btnFooterPlayPause.style.display = isVisible ? "inline-flex" : "none";
        this.btnFooterPlayPause.disabled = !finalEnabled;
        this.btnFooterPlayPause.style.opacity = finalEnabled ? "1" : "0.5";
        this.btnFooterPlayPause.style.cursor = finalEnabled ? "pointer" : "default";
        this.btnFooterPlayPause.innerHTML = finalIcon;
        this.btnFooterPlayPause.title = finalTitle;

        if (finalHighlighted) {
            this.btnFooterPlayPause.classList.add("btn-paused-highlight");
        } else {
            this.btnFooterPlayPause.classList.remove("btn-paused-highlight");
        }

        const btnStop = DomUtils.get("btn-stop");
        if (btnStop) {
            btnStop.disabled = !isStopEnabled;
            btnStop.style.opacity = isStopEnabled ? "1" : "0.5";
            btnStop.style.cursor = isStopEnabled ? "pointer" : "default";
            if (isStopHighlighted) btnStop.classList.add("btn-paused-highlight");
            else btnStop.classList.remove("btn-paused-highlight");
        }
    }

    /**
     * Renders the entire playback UI based on the given state.
     */
    renderAllPlaybackUI(state) {
        const { isVideo, status, currentMedia, isWebViewVisible, isPlaylistView } = state;

        // Auto overlay management
        if (status === "stopped" && !currentMedia && !isWebViewVisible) {
            this.updateMainOverlay('preview');
        }
        
        // Update footer buttons
        const footerConfig = this.buildFooterConfig(state);
        this.updateFooterPlaybackUI(footerConfig, isVideo);
        
        // Update display status
        const displayStatus = state.hasSecondaryDisplay ? "connected" : "waiting";
        this.updateDisplayStatus(displayStatus);
        
        // Update status text
        const statusText = this.getStatusText(state);
        this.updateCurrentItemInfo(statusText);
        
        // Update playlist items UI
        const playlistConfig = this.buildPlaylistConfig(state);
        this.updatePlaybackStateUI(playlistConfig);

        // Visibility
        this.setFooterTransportVisibility(!isPlaylistView);
        this.setPreviewControlsOverlayVisibility(!isVideo);
    }

    buildFooterConfig(state) {
        const { status, currentMedia, isVideo } = state;
        const isStaged = status === "staged";
        const isPlaying = status === "playing";
        const isPaused = status === "paused";
        const isStopped = status === "stopped";

        const config = {
            isVisible: true,
            isEnabled: true,
            icon: isPlaying ? UIManager.PAUSE_ICON : UIManager.PLAY_ICON,
            title: isPlaying ? "Pausar" : (isStaged ? "Reproduzir" : "Retomar"),
            isHighlighted: (isPaused || isStaged),
            isStopEnabled: !(isStaged || isStopped),
            isStopHighlighted: !(isPaused || isStaged) && (isPlaying || isStopped)
        };

        if (!isVideo) {
            if (isPlaying) {
                config.isEnabled = false;
                config.icon = UIManager.PLAY_ICON;
                config.isHighlighted = false;
                config.isStopHighlighted = true;
            } else if (isStaged) {
                config.title = "Reproduzir";
                config.isHighlighted = true;
                config.isStopHighlighted = false;
            }
        }
        return config;
    }

    buildPlaylistConfig(state) {
        const { status, currentMedia, isVideo } = state;
        const isPlaying = status === "playing";
        const isPaused = status === "paused";
        const isStaged = status === "staged";

        const config = {
            statusLabel: (isPlaying || isPaused) ? "NO AR" : (isStaged ? "PREPARADO" : ""),
            statusClass: isStaged ? "staged" : (isPlaying || isPaused ? status : ""),
            items: {}
        };

        if (currentMedia) {
            config.items[currentMedia.id] = {
                class: (isPlaying || isPaused) ? "playing" : "standby",
                icon: (isPlaying && isVideo) ? this.icons.pause : (isPlaying ? this.icons.stop : this.icons.play),
                title: (isPlaying && isVideo) ? "Pausar" : (isPlaying ? "Parar" : (isPaused ? "Retomar" : "Reproduzir"))
            };
        }
        return config;
    }

    getStatusText(state) {
        if (state.isPlaylistView) {
            return state.hasSecondaryDisplay ? "O segundo monitor: Conectado" : "O segundo monitor: ⚠️ Não detectado";
        }
        
        let text = "Parado: Nenhum item";
        if (state.currentMedia) {
            const fileName = state.currentMedia.title || state.currentMedia.filename;
            if (state.status === 'playing') text = `Reproduzindo: ${fileName}`;
            else if (state.status === 'paused') text = `Pausado: ${fileName}`;
            else if (state.status === 'staged') text = `Preparado: ${fileName}`;
        }
        return text;
    }

    /**
     * Displays a media item in the preview area.
     */
    showPreview(type, filePath, autoPlay = true) {
        console.log(`[UI] showPreview: ${type} -> ${filePath} (AutoPlay: ${autoPlay})`);
        
        this.updateMainOverlay('preview');

        const isVideo = type.includes('video') || filePath.toLowerCase().endsWith('.mp4');
        
        const normalizedPath = filePath.replace(/\\/g, '/');
        const safeUrl = `media://app/${normalizedPath}`;
        
        if (isVideo) {
            const newSrc = safeUrl;
            if (this.previewVideo.src !== newSrc) {
                this.previewVideo.onerror = (e) => console.error('[UI] Preview video error:', e, this.previewVideo.error);
                this.previewVideo.src = newSrc;
                this.previewSeeker.value = 0;
                this.previewSeeker.style.backgroundSize = `0% 100%`;
                this.previewVideo.load();
            }
            this.previewVideo.style.display = 'block';
            this.previewImage.style.display = 'none';
            if (autoPlay) {
                this.previewVideo.play().catch(e => {
                    if (e.name !== 'AbortError') console.warn('[UI] Preview auto-play failed:', e);
                });
            } else {
                this.previewVideo.pause();
            }
        } else {
            this.previewImage.onerror = (e) => console.error('[UI] Preview image error:', e);
            this.previewImage.src = safeUrl;
            this.previewImage.style.display = 'block';
            this.previewVideo.style.display = 'none';
            this.previewVideo.pause();
            this.previewVideo.removeAttribute('src');
            this.previewVideo.load();
        }
    }

    /**
     * Hides the preview area and restores the main content view.
     */
    hidePreview() {
        this.updateMainOverlay('guide');
        this.previewVideo.pause();

        if (this.stateLabel) {
            this.stateLabel.textContent = '';
            this.stateLabel.className = 'state-label';
        }
        
        this.previewVideo.removeAttribute('src');
        this.previewVideo.load();
        
        this.previewImage.removeAttribute('src');
    }

    /**
     * Displays help content in the UI.
     */
    showHelp(html) {
        this.helpContainer.innerHTML = html;
        this.updateMainOverlay('help');
    }

    /**
     * Hides the help view.
     */
    hideHelp() {
        if (this.helpView && this.helpView.style.display !== 'none') {
            this.updateMainOverlay('preview');
        }
    }

    /**
     * Sets the value of the Zoom mode selector.
     */
    setZoomMode(mode) {
        if (this.zoomModeSelect) {
            this.zoomModeSelect.value = mode || 'auto';
        }
    }

    /**
     * Complete Seeker Update.
     */
    updateSeeker(current, total) {
        if (!total || isNaN(total) || total <= 0) {
            this.previewSeeker.max = 1;
            this.previewSeeker.value = 0;
            this.previewSeeker.style.backgroundSize = `0% 100%`;
        } else {
            this.previewSeeker.max = total;
            if (!app.isDraggingSeeker) { 
                this.previewSeeker.value = current;
            }
            this.updateSeekerLabels(current, total);
        }
    }

    /**
     * Partial Update (Labels + Background only).
     */
    updateSeekerLabels(current, total) {
        const percentage = (total > 0 && !isNaN(total)) ? (current / total) * 100 : 0;
        this.previewSeeker.style.backgroundSize = `${percentage}% 100%`;
        
        const format = (s) => {
            const min = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        };
        
        this.previewTimeCurrent.textContent = format(current);
        this.previewTimeTotal.textContent = format(total || 0);
    }

    /**
     * Updates the playback state UI.
     */
    updatePlaybackStateUI(config) {
        const { statusLabel, statusClass, items } = config;

        if (this.stateLabel) {
            this.stateLabel.textContent = statusLabel || "";
            this.stateLabel.className = "state-label " + (statusClass || "");
        }

        const liElements = DomUtils.queryAll(".playlist-item-li", this.itemsList);
        liElements.forEach(li => {
            const itemId = li.dataset.id;
            const itemConfig = items[itemId];
            const btnPlay = DomUtils.query(".btn-play-item", li);

            li.classList.remove("playing", "standby");
            
            if (itemConfig) {
                if (itemConfig.class) li.classList.add(itemConfig.class);
                if (btnPlay) {
                    btnPlay.innerHTML = itemConfig.icon;
                    btnPlay.title = itemConfig.title;
                }
            } else {
                if (btnPlay) {
                    btnPlay.innerHTML = this.icons.play;
                    btnPlay.title = "Reproduzir";
                }
            }
        });
    }

    /**
     * Updates information about the current media item.
     */
    updateCurrentItemInfo(text) {
        const parts = text.split(': ');
        const label = parts[0];
        const value = parts.slice(1).join(': ');
        
        let colorClass = '';
        if (label === 'Preparado') colorClass = 'status-preparado';
        else if (label === 'Reproduzindo') colorClass = 'status-reproduzindo';
        else if (label === 'Pausado') colorClass = 'status-pausado';

        this.currentItemInfo.innerHTML = `
            <span id="current-item-status" class="${colorClass}">${label}: </span>
            <span id="current-item-filename">${value}</span>
        `;
    }

    /**
     * Updates the display status indicator.
     */
    updateDisplayStatus(status) {
        if (status === 'waiting') {
            this.currentItemInfo.classList.add('status-warning');
        } else {
            this.currentItemInfo.classList.remove('status-warning');
        }
    }

    /**
     * Shows a notification message.
     */
    showNotification(message, type = 'info') {
        console.log(`[UI] Notification (${type}): ${message}`);
    }

    /**
     * Gets the webview container's bounding rectangle.
     */
    getWebViewBounds() {
        const rect = this.webviewContainer.getBoundingClientRect();
        return {
            x: Math.floor(rect.left),
            y: Math.floor(rect.top),
            width: Math.floor(rect.width),
            height: Math.floor(rect.height)
        };
    }

    /**
     * Handles UI updates on download completion.
     */
    onDownloadComplete(itemId, newItemData) {
        const li = DomUtils.query(`li[data-id="${itemId}"]`, this.itemsList);
        if (li) {
            li.classList.remove('downloading');
            const style = DomUtils.get(`style-progress-${itemId}`);
            if (style) style.remove();
        }
    }

    /**
     * Displays an error message.
     */
    showError(itemId, message, filename = '') {
        let li = DomUtils.query(`li[data-id="${itemId}"]`, this.itemsList);
        if (!li) {
            li = DomUtils.create('li', { className: 'playlist-item-li error' });
            li.dataset.id = itemId;
            li.innerHTML = `
                <div class="item-content">
                    <div class="item-thumbnail error-icon"></div>
                    <div class="item-info">
                        <span class="item-title">${filename || message}</span>
                        <span class="item-type">Erro: ${message}</span>
                    </div>
                </div>
            `;
            this.itemsList.appendChild(li);
        } else {
            const thumbnail = DomUtils.query('.item-thumbnail', li);
            const titleSpan = DomUtils.query('.item-title', li);
            const typeSpan = DomUtils.query('.item-type', li);

            thumbnail.classList.remove('loading');
            thumbnail.classList.add('error-icon');
            
            titleSpan.textContent = message;
            typeSpan.textContent = 'Erro';
            li.classList.add('error');
        }

        setTimeout(() => {
            li.classList.add('fade-out');
            setTimeout(() => li.remove(), 4000);
        }, 4000);
    }

    /**
     * Sets callbacks for PlaylistListRenderer.
     */
    setPlaylistCallbacks(callbacks) {
        this.playlistRenderer.callbacks = callbacks;
    }

    // --- Modal Helpers ---
    showConfirmModal(message, onConfirm, onCancel) {
        const modal = DomUtils.get('custom-modal');
        const msgEl = DomUtils.get('modal-message');
        const btnConfirm = DomUtils.get('modal-confirm');
        const btnCancel = DomUtils.get('modal-cancel');

        if (!modal || !msgEl || !btnConfirm || !btnCancel) return false;

        msgEl.textContent = message;
        modal.style.display = 'flex';

        const close = (result) => {
            modal.style.display = 'none';
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            modal.onclick = null;
            if (result) onConfirm();
            else onCancel();
        };

        btnConfirm.onclick = () => close(true);
        btnCancel.onclick = () => close(false);
        modal.onclick = (e) => { if (e.target === modal) close(false); };
        return true;
    }

    // --- View Helpers ---
    isWebViewVisible() { return this.webviewContainer.style.display !== 'none'; }
    setWebViewVisibility(visible) {
        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(visible);
        }
    }
    
    setFooterTransportVisibility(visible) {
        const footerTransportButtons = DomUtils.query('.transport-buttons');
        if (footerTransportButtons) {
            footerTransportButtons.style.visibility = visible ? 'visible' : 'hidden';
        }
    }

    setPreviewControlsOverlayVisibility(visible) {
        if (this.previewControlsOverlay) {
            this.previewControlsOverlay.style.display = visible ? 'block' : 'none';
        }
    }
}

window.uiManager = new UIManager();
