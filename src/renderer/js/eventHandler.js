/**
 * eventHandler.js
 * Handles UI events, IPC listeners, and keyboard shortcuts.
 */

class EventHandler {
    constructor(app, ui, ipc, store) {
        this.app = app;
        this.ui = ui;
        this.ipc = ipc;
        this.store = store;
    }

    init() {
        console.log('[EventHandler] Initializing handlers...');
        this.setupUICallbacks();
        this.setupIPCListeners();
        this.setupKeyboardListeners();
    }

    /**
     * Sets up keyboard event listeners for application shortcuts.
     */
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.app.togglePlayback();
            }
            if (e.key === 'Delete') {
                this.handleDeleteAction();
            }
        });
    }

    /**
     * Handles the Delete key action to remove playlists or items.
     */
    handleDeleteAction() {
        const isPlaylistView = this.ui.isPlaylistView();

        if (isPlaylistView) {
            // プレイリストビューの場合
            const activePlaylist = document.querySelector('.playlist-item.active');
            if (activePlaylist) {
                const id = activePlaylist.querySelector('.item-more-actions')?.dataset.id;
                if (id) {
                    this.ui.showConfirmModal('Deseja realmente excluir esta playlist?', async () => {
                        await this.executePlaylistDeletion(id);
                    });
                }
            }
        } else {
            // アイテムビューの場合
            // アイテムは 'playing' または 'standby' クラスが付いているものが「選択/表示対象」とみなす
            const activeItem = document.querySelector('.playlist-item-li.playing, .playlist-item-li.standby');
            if (activeItem) {
                const id = activeItem.dataset.id;
                const playlistId = this.store.currentPlaylistId; 
                if (id && playlistId) {
                    this.ui.showConfirmModal('Deseja realmente excluir este arquivo?', async () => {
                        await this.executeItemDeletion(playlistId, id);
                    });
                }
            }
        }
    }

    /**
     * Executes playlist deletion logic without additional confirmation.
     */
    async executePlaylistDeletion(id) {
        const itemsToDelete = this.store.deletePlaylist(id);
        // Delete associated files and cancel active downloads
        for (const item of itemsToDelete) {
            if (item.status === 'downloading') {
                await this.ipc.cancelDownload(item.id);
            }
            if (item.filePath) await this.ipc.deleteFile(item.filePath);
        }
        // Delete associated playlist folder
        await this.ipc.deletePlaylistFolder(id);
    }

    /**
     * Executes item removal logic without additional confirmation.
     */
    async executeItemDeletion(playlistId, itemId) {
        const item = this.store.getItem(playlistId, itemId);
        if (item) {
            if (item.status === 'downloading') {
                await this.ipc.cancelDownload(item.id);
            }
            if (item.filePath) await this.ipc.deleteFile(item.filePath);
        }
        this.store.removeItem(playlistId, itemId);
    }

    /**
     * Wrappers for callback methods to be used by keyboard listener
     */
    async onPlaylistDelete(id) {
        if (await this.app.showCustomConfirm('Deseja realmente excluir esta playlist?')) {
            await this.executePlaylistDeletion(id);
        }
    }

    async onItemRemove(playlistId, itemId) {
        if (await this.app.showCustomConfirm('Deseja realmente excluir este arquivo?')) {
            await this.executeItemDeletion(playlistId, itemId);
        }
    }

    /**
     * Sets up IPC listeners to handle events from the main process.
     */
    setupIPCListeners() {
        this.ipc.onRequestSaveImage(async (url) => {
            await this.app.saveBrowserImage(url);
        });

        this.ipc.onDownloadStarted((data) => {
            this.ui.showNotification(`Download iniciado: ${data.filename}`);
            this.ui.playlistRenderer.renderDownloadItem(data.id, data.filename, this.ui.itemsList);
        });

        this.ipc.onDownloadProgress((data) => {
            this.ui.playlistRenderer.updateDownloadProgress(data.id, data.progress, this.ui.itemsList);
        });

        this.ipc.onDownloadError((data) => {
            console.log('[EventHandler] Download error received:', data);
            if (this.ui && typeof this.ui.showError === 'function') {
                this.ui.showError(data.id, data.message, data.filename);
            } else {
                console.error('[EventHandler] Cannot show error: ui.showError is not available');
            }
        });

        this.ipc.onMediaPlaybackStateChange((isPlaying) => {
            this.app.isPlaying = isPlaying;
            // Only update status if we aren't in a transition state or stopped
            if (this.app.status === 'playing' || this.app.status === 'paused') {
                this.app.status = isPlaying ? 'playing' : 'paused';
            }
            this.app.playbackManager.updatePlaybackUI();
        });

        this.ipc.onLoadMedia((data) => {
            this.app.currentMedia = data;
            const isAuto = (this.ui.zoomModeSelect && this.ui.zoomModeSelect.value === 'auto');   

            const { currentPlaylistId } = this.store.getState();
            this.app.lastPlaylistIdPlayed = currentPlaylistId;

            // Only force playing status if NOT waiting for Zoom (Auto-mode wait)
            if (!isAuto) {
                this.app.status = 'playing';
            } else {
                console.log('[EventHandler] [PAUSE-LOG] onLoadMedia received but keeping status staged/waiting.');
            }
            
            this.app.playbackManager.updatePlaybackUI();
        });

        this.ipc.onDisplayStatus((status) => {
            this.app.hasSecondaryDisplay = (status === 'connected');
            this.app.playbackManager.updatePlaybackUI();
            this.app.updateAudioMuteState();
        });

        this.ipc.onPlaybackCommand(({ action }) => {
            // Ignore 'stop' if already stopped, staged, or stopping to prevent feedback loops
            if (action === 'stop') {
                if (this.app.status === 'stopped' || this.app.status === 'staged' || this.app.isStopping) return;
                this.app.playbackManager.stopMedia('ipc command');
            }
        });

        // Handle Zoom Signals
        window.electronAPI.onZoomProcStdout((data) => {
            if (data.includes('[C#] COORDS:')) {
                const parts = data.split(':')[1].split(',');
                this.app.zoomCoords = { x: parseInt(parts[0]), y: parseInt(parts[1]) };
                console.log('[EventHandler] >>> SAVED ZOOM COORDS:', this.app.zoomCoords);
            }
        });

        window.electronAPI.onZoomSharingReady(() => {
            console.log('[EventHandler] >>> Zoom sharing READY (STARTED) signal received.');
            if (this.app.status === 'paused' && this.app.currentMedia?.mediaType?.includes('video')) {
                console.log('[EventHandler] >>> Auto-resuming video playback.');
                this.app.playbackManager.resumePlayback();
            } else {
                console.log('[EventHandler] Zoom signal ignored. Status:', this.app.status, 'Media:', this.app.currentMedia?.mediaType);
            }
        });

        window.electronAPI.onZoomSharingFinished(() => {
            console.log('[EventHandler] Zoom sharing FINISHED signal received.');
        });
    }

    setupUICallbacks() {
        console.log('[EventHandler] Setting up UI callbacks...');

        const handleNav = (key) => {
            this.ipc.navigateSite(key);

            // Remove active class from all navigation buttons
            document.querySelectorAll('.nav-icon-btn').forEach(btn => btn.classList.remove('active'));
            
            // Add active class to the selected button
            const activeBtn = document.getElementById(`btn-${key}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        };

        this.ui.btnCantico.onclick = () => handleNav('cantico');
        this.ui.btnReunioes.onclick = () => handleNav('reunioes');
        this.ui.btnVideos.onclick = () => handleNav('videos');
        this.ui.btnEsbocos.onclick = () => handleNav('esbocos');
        this.ui.btnWhatsapp.onclick = () => handleNav('whatsapp');

        this.ui.btnMenuTutorial.onclick = () => {
            window.electronAPI.showTutorial();
            this.ui.headerMenu.classList.remove('show');
        };
        this.ui.btnMenuYear.onclick = () => window.electronAPI.openYearVerseFolder();
        
        this.ui.btnMenuAbout.onclick = async () => {
            try {
                const html = await this.ipc.getAboutContent();
                // Ensure all nav buttons are deactivated before showing help
                document.querySelectorAll('.nav-icon-btn').forEach(btn => btn.classList.remove('active'));
                this.ui.showHelp(html);
            } catch (err) {
                console.error('[EventHandler] Failed to load about content:', err);
            }
        };

        this.ui.btnImportFile.onclick = () => this.app.handleImport();

        this.ui.btnCreatePlaylist.onclick = () => this.app.handleCreatePlaylist();
        this.ui.newPlaylistInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.app.handleCreatePlaylist();
        });

        this.ui.btnBackToPlaylists.onclick = async () => {
            // Remove active class from all navigation buttons
            document.querySelectorAll('.nav-icon-btn').forEach(btn => btn.classList.remove('active'));

            if (this.app.status === 'playing' || this.app.status === 'paused') {
                if (await this.app.showCustomConfirm('Deseja parar a reprodução e voltar às playlists?')) {
                    this.app.playbackManager.stopMedia('navigation to playlists');
                    this.ui.switchView('playlists');
                }
            } else {
                this.app.status = 'stopped';
                this.ui.switchView('playlists');
            }
            // Explicitly ensure preview is hidden and siteView is shown
            this.ui.hidePreview();
            this.app.updatePlaybackUI();
        };

        this.ui.setPlaylistCallbacks({
            onPlaylistSelect: (id) => {
                this.store.setCurrentPlaylistId(id);
                this.ui.switchView('items');

                // Auto-standby previous item if available
                const state = this.store.getState();
                const playlist = state.playlists[id];
                if (playlist && playlist.items.length > 0 && this.app.status === 'stopped') {
                    const lastItemId = this.app.lastStagedItemPerPlaylist[id];
                    const itemToStandby = playlist.items.find(i => i.id === lastItemId) || playlist.items[0];
                    this.app.playbackManager.prepareStagingMedia(itemToStandby);
                }
                this.app.updatePlaybackUI();
            },

            onPlaylistExport: async (id) => {
                const { playlists } = this.store.getState();
                const playlist = playlists[id];
                if (playlist) {
                    const result = await this.ipc.exportPlaylist(playlist);
                    if (result.success) {
                        this.ui.showConfirmModal(
                            `Playlist salva em: ${result.filePath}.\nCompartilhe pelo WhatsApp via anexo.`,
                            () => {},
                            null,
                            'ok'
                        );
                    } else {
                        this.ui.showNotification(`Erro ao exportar: ${result.error}`, 'error');
                    }
                }
            },

            onPlaylistDelete: async (id) => {
                if (await this.app.showCustomConfirm('Deseja realmente excluir esta playlist?')) {
                    await this.executePlaylistDeletion(id);
                }
            },

            onPlaylistRename: (id, newName) => this.store.renamePlaylist(id, newName),

            onPlaylistContextMenu: (id, playlist) => {
                this.ipc.showPlaylistContextMenu({ playlist });
            },

            // Item List Interactions
            onItemSelect: (item) => {
                console.log('[EventHandler] Staging item in preview area.');
                this.app.playbackManager.prepareStagingMedia(item);
            },

            onItemPlay: (item) => {
                console.log(`[EventHandler] onItemPlay triggered for: ${item.title || item.filename}`);
                if (this.app.currentMedia && this.app.currentMedia.id === item.id) {
                    // Toggle playback if it's the same item
                    this.app.togglePlayback();
                } else {
                    // Otherwise play it
                    this.app.playbackManager.playMedia(item);
                }
            },

            onItemRemove: async (playlistId, itemId) => {
                if (await this.app.showCustomConfirm('Deseja realmente excluir este arquivo?')) {
                    await this.executeItemDeletion(playlistId, itemId);
                }
            },

            onItemRename: (itemId, newName) => {
                this.store.updateItem(itemId, { title: newName });
            }
        });

        this.ui.btnFooterPlayPause.onclick = () => this.app.togglePlayback();

        if (this.ui.zoomModeSelect) {
            this.ui.zoomModeSelect.onchange = (e) => {
                this.ipc.updateConfig({ zoomMode: e.target.value });
                console.log(`[EventHandler] Zoom mode updated to: ${e.target.value}`);
                this.app.updatePlaybackUI();
            };
        }

        this.ui.btnShareApp = document.getElementById('btn-share-app');
        if (this.ui.btnShareApp) {
            this.ui.btnShareApp.onclick = async () => {
                // Add click effect
                this.ui.btnShareApp.classList.add('clicked');
                setTimeout(() => this.ui.btnShareApp.classList.remove('clicked'), 500);

                try {
                    await navigator.clipboard.writeText('https://dahobr.github.io/jw-meeting-player/');
                    this.ui.showNotification('O link do App copiado!');
                } catch (err) {
                    this.ui.showNotification('Erro ao copiar endereço', 'error');
                }
            };
        }

        this.ui.btnStop = document.getElementById('btn-stop');
        if (this.ui.btnStop) {
            this.ui.btnStop.onclick = () => this.app.playbackManager.stopMedia('manual click');
        }

        if (window.Sortable && this.ui.itemsList) {
            new Sortable(this.ui.itemsList, {
                animation: 150,
                onEnd: (evt) => {
                    const { currentPlaylistId } = this.store.getState();
                    this.store.reorderItems(currentPlaylistId, evt.oldIndex, evt.newIndex);
                }
            });
        }
    }
}

// Global exposure is not strictly needed if instantiated in app.js, 
// but consistency is maintained with other classes.
window.EventHandler = EventHandler;
