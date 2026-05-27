/**
 * uiManager.js
 * Renderer UI Manager - Handles DOM manipulation and templates.
 */

class UIManager {
    /**
     * Initializes the UIManager, setting up references to DOM elements and global event listeners.
     */
    constructor() {
        // Elements
        this.btnCantico = document.getElementById('btn-cantico');
        this.btnReunioes = document.getElementById('btn-reunioes');
        this.btnVideos = document.getElementById('btn-videos');
        this.btnEsbocos = document.getElementById('btn-esbocos');
        this.btnOpenFolder = document.getElementById('btn-open-folder');
        this.btnOpenYearVerseFolder = document.getElementById('btn-open-year-verse-folder');
        this.btnCreatePlaylist = document.getElementById('btn-create-playlist');
        this.btnBackToPlaylists = document.getElementById('btn-back-to-playlists');
        this.btnImportFile = document.getElementById('btn-import-file');
        this.zoomModeSelect = document.getElementById('zoom-mode-select');
        
        this.btnFooterPlayPause = document.getElementById('btn-footer-play-pause');
        this.btnFooterPrev = document.getElementById('btn-footer-prev');
        this.btnFooterNext = document.getElementById('btn-footer-next');

        // Add click listeners
        this.btnFooterPrev.onclick = () => this.onPrevious();
        this.btnFooterNext.onclick = () => this.onNext();
        
        this.newPlaylistInput = document.getElementById('new-playlist-name');
        this.playlistList = document.getElementById('playlist-list');
        this.itemsList = document.getElementById('playlist-items-ul');
        this.currentPlaylistTitle = document.getElementById('current-playlist-title');
        this.currentItemInfo = document.getElementById('current-item-info');
        
        this.viewPlaylists = document.getElementById('view-playlists');
        this.viewItems = document.getElementById('view-items');
        this.webviewContainer = document.querySelector('.webview-container');

        // Preview Elements
        this.previewArea = document.getElementById('preview-area');
        this.previewVideo = document.getElementById('preview-video');
        this.previewImage = document.getElementById('preview-image');
        this.previewSeeker = document.getElementById('preview-seeker');
        this.previewControls = document.getElementById('preview-controls-container');
        this.previewControlsOverlay = document.getElementById('preview-controls-overlay');
        this.previewTimeCurrent = document.getElementById('preview-time-current');
        this.previewTimeTotal = document.getElementById('preview-time-total');
        this.stateLabel = document.getElementById('preview-state-label');

        // Help Elements
        this.helpView = document.getElementById('help-view');
        this.helpContainer = document.getElementById('help-html-container');

        // Common SVG Icons
        this.icons = {
            play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
            pause: '<svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
            stop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>',
            edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
            delete: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
        };

        this.btnMenu = document.getElementById('btn-menu');
        this.headerMenu = document.getElementById('header-menu');
        this.btnMenuTutorial = document.getElementById('btn-menu-tutorial');
        this.btnMenuYear = document.getElementById('btn-menu-year');
        this.btnMenuDownloads = document.getElementById('btn-menu-downloads');
        this.btnMenuHelp = document.getElementById('btn-menu-help');
        this.btnMenuAbout = document.getElementById('btn-menu-about');
        this.btnMenuGuide = document.getElementById('btn-menu-guide');

        // Global click listener to close dropdowns
        document.addEventListener('click', (e) => {
            if (!this.btnMenu.contains(e.target)) {
                if (this.headerMenu.classList.contains('show')) {
                    this.headerMenu.classList.remove('show');
                }
            }
            document.querySelectorAll('.item-dropdown.show').forEach(d => d.classList.remove('show'));
        });

        this.btnMenu.onclick = (e) => {
            e.stopPropagation();
            this.headerMenu.classList.toggle('show');
        };

        this.operationGuide = document.getElementById('operation-guide');
        this.previewMediaWrapper = document.querySelector('.preview-media-wrapper');
    }

    /**
     * Centralized method to manage main content overlays.
     * @param {string} mode - The view mode to display: 'preview', 'guide', 'help', or 'webview'.
     */
    updateMainOverlay(mode) {
        console.log(`[UI] updateMainOverlay: ${mode}`);
        const isPlaylist = this.isPlaylistView();

        // 1. Hide everything by default
        this.previewArea.style.display = 'none';
        this.operationGuide.style.display = 'none';
        this.helpView.style.display = 'none';
        
        // Native WebView visibility
        let webViewVisible = false;

        if (isPlaylist) {
            switch (mode) {
                case 'help':
                    this.helpView.style.display = 'flex';
                    break;
                case 'webview':
                    webViewVisible = true;
                    break;
                case 'guide':
                case 'preview': // Fallback to guide in playlist view
                default:
                    this.operationGuide.style.display = 'flex';
                    this.previewMediaWrapper.style.display = 'none';
                    this.previewControls.style.display = 'none';
                    if (this.stateLabel) this.stateLabel.style.display = 'none';
                    this.renderOperationGuide(this.zoomModeSelect ? this.zoomModeSelect.value : 'auto');
                    break;
            }
        } else {
            this.previewArea.style.display = 'flex';
            this.previewMediaWrapper.style.display = 'flex';
            this.previewControls.style.display = 'flex';
            if (this.stateLabel) this.stateLabel.style.display = 'block';

            switch (mode) {
                case 'help':
                    this.helpView.style.display = 'flex';
                    this.previewArea.style.display = 'none';
                    break;
                case 'guide':
                    this.operationGuide.style.display = 'flex';
                    this.previewArea.style.display = 'none';
                    this.renderOperationGuide(this.zoomModeSelect ? this.zoomModeSelect.value : 'auto');
                    break;
                case 'webview':
                    webViewVisible = true;
                    this.previewArea.style.display = 'none';
                    break;
                case 'preview':
                default:
                    break;
            }
        }

        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(webViewVisible);
        }
    }

    /**
     * Resets the UI to show the preview area, hiding all overlays.
     */
    ensurePreviewVisible() {
        if (this.isPlaylistView()) return;
        this.updateMainOverlay('preview');
    }

    /**
     * Checks if the playlist view is currently displayed.
     */
    isPlaylistView() {
        return this.viewPlaylists.style.display !== 'none';
    }

    /**
     * Switches the UI view between 'playlists' and 'items'.
     */
    switchView(viewName) {
        if (viewName === 'playlists') {
            this.viewPlaylists.style.display = 'block';
            this.viewItems.style.display = 'none';
            this.updateMainOverlay('guide');
        } else {
            this.viewPlaylists.style.display = 'none';
            this.viewItems.style.display = 'block';
            this.updateMainOverlay('preview');
        }
    }

    // UI Constants
    static PLAY_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
    static PAUSE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';

    /**
     * Renders the entire playback UI based on the given state.
     */
    renderAllPlaybackUI(state) {
        const isVideo = state.currentMedia?.mediaType?.includes("video");
        
        // Update footer buttons
        const footerConfig = this.buildFooterConfig(state);
        this.updateFooterPlaybackUI(footerConfig, isVideo);
        
        // Update display status
        const displayStatus = state.hasSecondaryDisplay ? "connected" : "waiting";
        this.updateDisplayStatus(displayStatus);
        
        // Update status text
        const statusText = this.getStatusText(state);
        this.updateCurrentItemInfo(statusText);
        
        // Visibility
        this.setFooterTransportVisibility(!state.isPlaylistView);
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
     * Shows the operation guide view.
     */
    showOperationGuide(zoomMode) {
        this.updateMainOverlay('guide');
    }

    /**
     * Hides the operation guide view.
     */
    hideOperationGuide() {
        this.updateMainOverlay('preview');
    }

    /**
     * Renders the operation guide template.
     */
    renderOperationGuide(zoomMode) {
        this.operationGuide.innerHTML = window.templates.renderOperationGuide(zoomMode);
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
     * Renders the list of playlists.
     */
    renderPlaylists(playlists, currentId) {
        this.playlistList.innerHTML = '';
        Object.entries(playlists).forEach(([id, playlist]) => {
            const div = document.createElement('div');
            div.className = `playlist-item ${id === currentId ? 'active' : ''}`;
            div.innerHTML = `
                <div class="playlist-info">
                    <span class="playlist-name" id="name-${id}" title="${playlist.name}">${playlist.name}</span>
                    <input type="text" class="edit-playlist-input" id="input-${id}" value="${playlist.name}" style="display: none;">
                    <span class="playlist-meta">${playlist.items.length} items</span>
                </div>
                <div class="playlist-item-actions">
                  <button class="btn-edit-playlist" data-id="${id}" title="Renomear">${this.icons.edit}</button>
                  <button class="btn-delete-playlist" data-id="${id}" title="Excluir">${this.icons.trash}</button>
                </div>
            `;
            
            div.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('input')) {
                    this.onPlaylistSelect(id);
                }
            });
            
            const btnEdit = div.querySelector('.btn-edit-playlist');
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlaylistEdit(id);
            });

            const btnDelete = div.querySelector('.btn-delete-playlist');
            btnDelete.addEventListener('click', function(e) {
                e.stopPropagation();
                this.onPlaylistDelete(id);
            }.bind(this));
            
            const input = div.querySelector('.edit-playlist-input');
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.onPlaylistRename(id, input.value);
                    this.togglePlaylistEdit(id, false);
                }
            });
            input.addEventListener('blur', () => {
                this.togglePlaylistEdit(id, false);
            });
            
            this.playlistList.appendChild(div);
        });
    }

    /**
     * Renders items for a specific playlist.
     */
    renderPlaylistItems(id, playlist) {
        this.currentPlaylistTitle.textContent = playlist.name;
        this.itemsList.innerHTML = '';
        
        if (playlist.items.length === 0) {
            const li = document.createElement('li');
            li.className = 'playlist-empty-msg';
            li.textContent = 'Nenhum item';
            this.itemsList.appendChild(li);
            return;
        }

        playlist.items.forEach((item, index) => {
            if (!item) return;
            const li = document.createElement('li');
            li.className = 'playlist-item-li';
            li.dataset.id = item.id;
            li.dataset.index = index;
            
            li.innerHTML = `
                <div class="item-content">
                    <div class="item-thumbnail">
                        ${item.thumbnailData ? `<img src="${item.thumbnailData}" alt="thumb">` : `<div class="placeholder">${item.mediaType === 'video' ? '🎬' : '🖼️'}</div>`}
                    </div>
                    <div class="item-info">
                        <span class="item-title" id="item-name-${item.id}" title="${item.title || item.filename}">${item.title || item.filename}</span>
                        <input type="text" class="edit-item-input" id="item-input-${item.id}" value="${item.title || item.filename}" style="display: none;">
                        <span class="item-type">${item.mediaType}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-play-item btn-item-action" title="Reproduzir">${this.icons.play}</button>
                        <div class="item-more-actions" data-id="${item.id}">
                            ⋮
                            <div class="item-dropdown" id="dropdown-${item.id}">
                                <div class="item-dropdown-item btn-edit-item">${this.icons.edit} Renomear</div>
                                <div class="item-dropdown-item btn-delete-item">${this.icons.trash} Excluir</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            li.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.item-more-actions') && !e.target.closest('input')) {
                    this.onItemSelect(item);
                }
            });
            
            const btnPlay = li.querySelector('.btn-play-item');
            btnPlay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onItemPlay(item);
            });

            const moreActions = li.querySelector('.item-more-actions');
            const dropdown = li.querySelector('.item-dropdown');
            moreActions.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.item-dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });

            const btnEdit = li.querySelector('.btn-edit-item');
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('show');
                this.toggleItemEdit(item.id);
            });
            
            const btnDelete = li.querySelector('.btn-delete-item');
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('show');
                this.onItemRemove(id, item.id);
            });

            const input = li.querySelector('.edit-item-input');
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.onItemRename(item.id, input.value);
                    this.toggleItemEdit(item.id, false);
                }
            });
            input.addEventListener('blur', () => {
                this.toggleItemEdit(id, false);
            });
            
            this.itemsList.appendChild(li);
        });
    }

    /**
     * Toggles the edit mode for a playlist item.
     */
    togglePlaylistEdit(id, show = true) {
        const nameSpan = document.getElementById(`name-${id}`);
        const input = document.getElementById(`input-${id}`);
        if (nameSpan && input) {
            nameSpan.style.display = show ? 'none' : 'block';
            input.style.display = show ? 'block' : 'none';
            if (show) {
                requestAnimationFrame(() => {
                    input.focus();
                    input.select();
                });
            }
        }
    }

    /**
     * Toggles the edit mode for a specific playlist item.
     */
    toggleItemEdit(id, show = true) {
        const nameSpan = document.getElementById(`item-name-${id}`);
        const input = document.getElementById(`item-input-${id}`);
        if (nameSpan && input) {
            nameSpan.style.display = show ? 'none' : 'block';
            input.style.display = show ? 'block' : 'none';
            if (show) input.focus();
        }
    }

    /**
     * Renders a download item in the list.
     */
    renderDownloadItem(itemId, filename) {
        const li = document.createElement('li');
        li.className = 'playlist-item-li downloading';
        li.dataset.id = itemId;
        li.dataset.progress = 0;
        
        li.innerHTML = `
            <div class="item-content">
                <div class="item-thumbnail loading" style="--progress: 0;"></div>
                <div class="item-info">
                    <span class="item-title">${filename}</span>
                    <span class="item-type">Baixando...</span>
                </div>
            </div>
        `;
        this.itemsList.appendChild(li);
    }

    /**
     * Updates the download progress indicator.
     */
    updateDownloadProgress(itemId, percentage, filename) {
        const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (li) {
            li.dataset.progress = percentage;
            const thumbnail = li.querySelector('.item-thumbnail');
            if (thumbnail) {
                thumbnail.style.setProperty('--progress', percentage);
                if (percentage >= 100) {
                    thumbnail.classList.remove('loading');
                }
            }
        }
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

        const liElements = this.itemsList.querySelectorAll(".playlist-item-li");
        liElements.forEach(li => {
            const itemId = li.dataset.id;
            const itemConfig = items[itemId];
            const btnPlay = li.querySelector(".btn-play-item");

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
        const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (li) {
            li.classList.remove('downloading');
            const style = document.getElementById(`style-progress-${itemId}`);
            if (style) style.remove();
        }
    }

    /**
     * Displays an error message.
     */
    showError(itemId, message, filename = '') {
        let li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (!li) {
            li = document.createElement('li');
            li.className = 'playlist-item-li error';
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
            const thumbnail = li.querySelector('.item-thumbnail');
            const titleSpan = li.querySelector('.item-title');
            const typeSpan = li.querySelector('.item-type');

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

    // Callbacks
    onPlaylistSelect(id) {}
    onPlaylistDelete(id) {}
    onPlaylistRename(id, newName) {}
    onItemSelect(item) {}
    onItemPlay(item) {}
    onItemRemove(playlistId, itemId) {}
    onItemRename(itemId, newName) {}
    onPrevious() {}
    onNext() {}

    // --- Modal Helpers ---
    showConfirmModal(message, onConfirm, onCancel) {
        const modal = document.getElementById('custom-modal');
        const msgEl = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm');
        const btnCancel = document.getElementById('modal-cancel');

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
        const footerTransportButtons = document.querySelector('.transport-buttons');
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
