/**
 * uiManager.js
 * Renderer UI Manager - Handles DOM manipulation and templates.
 */

class UIManager {
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
        
        this.newPlaylistInput = document.getElementById('new-playlist-name');
        this.playlistList = document.getElementById('playlist-list');
        this.itemsList = document.getElementById('playlist-items-ul');
        this.currentPlaylistTitle = document.getElementById('current-playlist-title');
        this.currentItemInfo = document.getElementById('current-item-info');
        this.volumeSlider = document.getElementById('volume-slider');
        
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
        this.btnMenuYear = document.getElementById('btn-menu-year');
        this.btnMenuDownloads = document.getElementById('btn-menu-downloads');
        this.btnMenuHelp = document.getElementById('btn-menu-help');
        this.btnMenuGuide = document.getElementById('btn-menu-guide');

        // Global click listener to close dropdowns
        document.addEventListener('click', (e) => {
            if (!this.btnMenu.contains(e.target)) {
                this.headerMenu.classList.remove('show');
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

    switchView(viewName) {
        if (viewName === 'playlists') {
            this.viewPlaylists.style.display = 'block';
            this.viewItems.style.display = 'none';
            // Auto-hide preview and show SiteView when in playlist list
            this.hidePreview();
        } else {
            this.viewPlaylists.style.display = 'none';
            this.viewItems.style.display = 'block';
            // Show preview area and hide SiteView when entering a playlist
            this.previewArea.style.display = 'flex';
            if (window.electronAPI && window.electronAPI.toggleWebView) {
                window.electronAPI.toggleWebView(false);
            }
        }
    }

    /**
     * Atualiza o estado visual do botão de reprodução/pausa no rodapé.
     */
    updateFooterPlaybackUI(status, isVideo, isPlaying) {
        const isStaged = status === 'staged';
        const isPaused = status === 'paused';

        if (isVideo) {
            this.btnFooterPlayPause.disabled = false;
            this.btnFooterPlayPause.style.opacity = '1';
            this.btnFooterPlayPause.style.cursor = 'pointer';
            this.btnFooterPlayPause.innerHTML = isPlaying ? window.app.constructor.PAUSE_ICON : window.app.constructor.PLAY_ICON;
            this.btnFooterPlayPause.style.display = 'inline-flex';
            this.btnFooterPlayPause.title = isPlaying ? 'Pausar' : (isStaged ? 'Reproduzir' : 'Retomar');

            if (isPaused || isStaged) {
                this.btnFooterPlayPause.classList.add('btn-paused-highlight');
                // btnStop might not be available if not initialized in UIManager
                const btnStop = document.getElementById('btn-stop');
                if (btnStop) btnStop.classList.remove('btn-paused-highlight');
            } else {
                this.btnFooterPlayPause.classList.remove('btn-paused-highlight');
                const btnStop = document.getElementById('btn-stop');
                if (btnStop) btnStop.classList.add('btn-paused-highlight');
            }
        } else {
            if (isStaged) {
                this.btnFooterPlayPause.disabled = false;
                this.btnFooterPlayPause.style.opacity = '1';
                this.btnFooterPlayPause.style.cursor = 'pointer';
                this.btnFooterPlayPause.innerHTML = window.app.constructor.PLAY_ICON;
                this.btnFooterPlayPause.style.display = 'inline-flex';
                this.btnFooterPlayPause.title = 'Reproduzir';
                this.btnFooterPlayPause.classList.add('btn-paused-highlight');
                const btnStop = document.getElementById('btn-stop');
                if (btnStop) btnStop.classList.remove('btn-paused-highlight');
            } else if (isPlaying) {
                this.btnFooterPlayPause.style.display = 'inline-flex';
                this.btnFooterPlayPause.innerHTML = this.icons.play;
                this.btnFooterPlayPause.title = 'Reproduzir';
                this.btnFooterPlayPause.disabled = true;
                this.btnFooterPlayPause.style.opacity = '0.5';
                this.btnFooterPlayPause.style.cursor = 'default';
                this.btnFooterPlayPause.classList.remove('btn-paused-highlight');
                const btnStop = document.getElementById('btn-stop');
                if (btnStop) btnStop.classList.add('btn-paused-highlight');
            } else {
                this.btnFooterPlayPause.disabled = false;
                this.btnFooterPlayPause.style.opacity = '1';
                this.btnFooterPlayPause.style.cursor = 'pointer';
                this.btnFooterPlayPause.style.display = 'inline-flex';
            }
        }
    }

    /**
     * Show preview area and hide SiteView
     */
    showPreview(type, filePath, autoPlay = true) {
        console.log(`[UI] showPreview: ${type} -> ${filePath} (AutoPlay: ${autoPlay})`);
        
        this.hideOperationGuide();
        this.hideHelp();

        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(false);
        }

        this.previewArea.style.display = 'flex';
        const isVideo = type.includes('video') || filePath.toLowerCase().endsWith('.mp4');
        
        const normalizedPath = filePath.replace(/\\/g, '/');
        const safeUrl = `media://app/${normalizedPath}`;
        
        if (isVideo) {
            const newSrc = safeUrl;
            console.log(`[UI] Setting preview video source to: ${newSrc}`);
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
                console.log('[UI] Attempting auto-play');
                this.previewVideo.play().catch(e => {
                    if (e.name !== 'AbortError') console.warn('[UI] Preview auto-play failed:', e);
                });
            } else {
                this.previewVideo.pause();
            }
        } else {
            console.log(`[UI] Setting preview image source to: ${safeUrl}`);
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
     * Hide preview area and re-show SiteView
     */
    hidePreview() {
        console.log('[UI] hidePreview called');
        this.hideOperationGuide();
        this.previewArea.style.display = 'none';
        this.previewVideo.pause();

        if (this.stateLabel) {
            this.stateLabel.textContent = '';
            this.stateLabel.className = 'state-label';
        }
        
        // Suppress MEDIA_ELEMENT_ERROR: Empty src attribute
        this.previewVideo.removeAttribute('src');
        this.previewVideo.load();
        
        this.previewImage.removeAttribute('src');
        
        this.hideHelp();

        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(true);
        }
    }

    showHelp(html) {
        console.log('[UI] showHelp called');
        this.helpContainer.innerHTML = html;
        this.helpView.style.display = 'flex';
        this.previewArea.style.display = 'none'; // Ensure preview is hidden
        
        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(false);
        }
    }

    hideHelp() {
        if (this.helpView && this.helpView.style.display !== 'none') {
            console.log('[UI] hideHelp called');
            this.helpView.style.display = 'none';
        }
    }

    showOperationGuide(zoomMode) {
        this.hideHelp();
        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(false);
        }

        this.previewArea.style.display = 'flex';
        this.operationGuide.style.display = 'flex';
        this.previewMediaWrapper.style.display = 'none';
        this.previewControls.style.display = 'none';
        if (this.stateLabel) this.stateLabel.style.display = 'none';

        this.renderOperationGuide(zoomMode);
    }

    hideOperationGuide() {
        this.operationGuide.style.display = 'none';
        this.previewMediaWrapper.style.display = 'flex';
        this.previewControls.style.display = 'flex';
        if (this.stateLabel) this.stateLabel.style.display = 'block';
    }

    renderOperationGuide(zoomMode) {
        const isAuto = zoomMode === 'auto';
        const isSemi = zoomMode === 'semi';
        const isManual = zoomMode === 'off';
        const modeText = isAuto ? 'Zoom Automático' : (isSemi ? 'Zoom Semiautomático' : 'Zoom Manual');
        
        this.operationGuide.innerHTML = `
            <div class="guide-card">
                <div class="guide-header">
                    <h2>Guia de Operação</h2>
                    <span class="guide-mode-badge">Modo: ${modeText}</span>
                </div>
                <div class="guide-steps">
                    ${!isManual ? `
                    <div class="guide-step">
                        <div class="guide-step-num">0</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Configurar Atalho Global</div>
                            <div class="guide-step-desc">
                                No Zoom (Configurações > Atalhos do teclado):<br>
                                Procure <b>Iniciar/interromper compartilhamento de tela</b> e ative <b>Atalho global</b>.
                            </div>
                        </div>
                        <div class="guide-icon-box">⚙️</div>
                    </div>` : ''}
                    <div class="guide-step">
                        <div class="guide-step-num">1</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Preparar Playlist</div>
                            <div class="guide-step-desc"><b>Crie e/ou escolha</b> uma playlist na barra lateral.</div>
                        </div>
                        <div class="guide-icon-box">📋</div>
                    </div>
                    <div class="guide-step">
                        <div class="guide-step-num">2</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Selecionar Mídia (Standby)</div>
                            <div class="guide-step-desc">Clique no item. Ele ficará pronto, mas <b>não aparecerá</b> na TV ainda.</div>
                        </div>
                        <div class="guide-icon-box">🖱️</div>
                    </div>
                    <div class="guide-step">
                        <div class="guide-step-num">3</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Iniciar Reprodução</div>
                            <div class="guide-step-desc">Clique no <b>Reproduzir</b>. O vídeo aparecerá na <b>2ª tela</b> ${!isAuto ? 'e você deve compartilhar pelo Zoom manualmente.' : 'e o Zoom será acionado.'}</div>
                        </div>
                        <div class="guide-icon-box"><div class="guide-play-mock"></div></div>
                    </div>
                    ${(isAuto || isSemi) ? `
                    <div class="guide-step zoom-step">
                        <div class="guide-step-num">4</div>
                        <div class="guide-step-content">
                            <span class="guide-zoom-tag">Na janela do Zoom (Apenas na 1ª vez)</span>
                            <div class="guide-step-title">Marcar "Otimizar"</div>
                            <div class="guide-step-desc">Marque <b>"Otimizar para clipe de vídeo"</b> no Zoom.</div>
                        </div>
                        <div class="guide-icon-box">✅</div>
                    </div>
                    <div class="guide-step zoom-step">
                        <div class="guide-step-num">5</div>
                        <div class="guide-step-content">
                            <span class="guide-zoom-tag">${isAuto ? 'Na janela do Zoom (Apenas na 1ª vez)' : 'Na janela do Zoom (Sempre)'}</span>
                            <div class="guide-step-title">Clique Duplo na Tela 2</div>
                            <div class="guide-step-desc">Dê um <b>clique duplo</b> no quadro da "Tela 2" para iniciar.</div>
                        </div>
                        <div class="guide-icon-box">🖱️🖱️</div>
                    </div>
                    ` : ''}
                </div>
                ${isAuto ? `
                <div class="guide-attention" style="text-align: left;">
                    <b style="display: block; text-align: center;">⚠️ ATENÇÃO</b>
                    <ul style="padding-left: 20px; margin: 10px 0 0 0;">
                        <li>Estes passos (4 e 5) são necessários apenas no primeiro uso.</li>
                        <li>A partir da segunda vez, o sistema assume o controle automaticamente.</li>
                        <li>Não mexa no mouse durante o processamento!</li>
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Complete Seeker Update (max + value + background)
     * This is called when duration is known (e.g., onloadedmetadata) or when external seek is confirmed.
     */
    updateSeeker(current, total) {
        if (!total || isNaN(total) || total <= 0) {
            // Handle cases where duration is not yet available or invalid
            this.previewSeeker.max = 1; // Set a minimal valid range to prevent errors
            this.previewSeeker.value = 0;
            this.previewSeeker.style.backgroundSize = `0% 100%`;
        } else {
            this.previewSeeker.max = total;
            // Only update value if not actively dragging (app.js handles this more granularly now)
            // This is mainly for initial setup or external updates.
            if (!app.isDraggingSeeker) { 
                this.previewSeeker.value = current;
            }
            this.updateSeekerLabels(current, total);
        }
    }

    /**
     * Partial Update (Labels + Background only - safe for dragging)
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
            btnDelete.addEventListener('click', function(e) { // Changed from arrow function to function expression with bind
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

            // Kebab Menu Toggle
            const moreActions = li.querySelector('.item-more-actions');
            const dropdown = li.querySelector('.item-dropdown');
            moreActions.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns
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

    toggleItemEdit(id, show = true) {
        const nameSpan = document.getElementById(`item-name-${id}`);
        const input = document.getElementById(`item-input-${id}`);
        if (nameSpan && input) {
            nameSpan.style.display = show ? 'none' : 'block';
            input.style.display = show ? 'block' : 'none';
            if (show) input.focus();
        }
    }

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
     * Atualiza a interface da playlist (ícones e estado dos botões) 
     * com base no status atual da reprodução.
     * 
     * @execution_context 
     * - Chamado por: App.updatePlaybackUI() em app.js
     * - Quando: Sempre que o status da reprodução (playing, staged, etc.) é alterado.
     * 
     * @param {string} status - Status atual ('playing', 'paused', 'staged', 'stopped')
     * @param {string|number|null} activeItemId - ID do item que está sendo reproduzido ou em preparação
     */
    updatePlaybackStateUI(status, activeItemId) {
        const items = this.itemsList.querySelectorAll('.playlist-item-li');

        // Update state label ['PREPARADO', 'NO AR']
        if (this.stateLabel) {
            this.stateLabel.className = 'state-label'; // Reset classes
            if (status === 'playing' || status === 'paused') {
                this.stateLabel.textContent = 'NO AR';
                this.stateLabel.classList.add(status);
            } else if (status === 'staged') {
                this.stateLabel.textContent = 'PREPARADO';
                this.stateLabel.classList.add('staged');
            } else {
                this.stateLabel.textContent = '';
            }
        }

        items.forEach(li => {
            const itemId = li.dataset.id;
            const btnPlay = li.querySelector('.btn-play-item');
            
            li.classList.remove('playing', 'standby');
            
            // If item is the active/staged one
            if (itemId == activeItemId) {
                if (status === 'playing' || status === 'paused') {
                    li.classList.add('playing');
                    const isVideo = li.querySelector('.item-type').textContent.toLowerCase().includes('video');
                    
                    if (status === 'playing') {
                        btnPlay.innerHTML = isVideo ? this.icons.pause : this.icons.stop;
                        btnPlay.title = isVideo ? 'Pausar' : 'Parar';
                    } else {
                        // paused state
                        btnPlay.innerHTML = this.icons.play;
                        btnPlay.title = 'Retomar';
                    }
                } else if (status === 'staged') {
                    li.classList.add('standby');
                    btnPlay.innerHTML = this.icons.play;
                    btnPlay.title = 'Reproduzir';
                }
            } else {
                // Stopped or other items
                btnPlay.innerHTML = this.icons.play;
                btnPlay.title = 'Reproduzir';
            }
        });
    }

    updateCurrentItemInfo(text) {
        // text is expected as "Status: Filename"
        const parts = text.split(': ');
        const status = parts[0];
        const filename = parts.slice(1).join(': ');
        
        this.currentItemInfo.innerHTML = `
            <span id="current-item-status">${status}</span>
            <span id="current-item-filename">${filename}</span>
        `;
        this.currentItemInfo.classList.remove('status-warning');
    }

    updateDisplayStatus(status) {
        if (status === 'waiting') {
            this.currentItemInfo.textContent = '⚠️ Segundo monitor não detectado';
            this.currentItemInfo.classList.add('status-warning');
        } else {
            if (this.currentItemInfo.classList.contains('status-warning')) {
                this.currentItemInfo.textContent = 'Monitor conectado. Pronto para reproduzir.';
                this.currentItemInfo.classList.remove('status-warning');
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log(`[UI] Notification (${type}): ${message}`);
    }

    getWebViewBounds() {
        const rect = this.webviewContainer.getBoundingClientRect();
        return {
            x: Math.floor(rect.left),
            y: Math.floor(rect.top),
            width: Math.floor(rect.width),
            height: Math.floor(rect.height)
        };
    }

    onDownloadComplete(itemId, newItemData) {
        const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (li) {
            li.classList.remove('downloading');
            // プログレスバー用のスタイルタグを削除
            const style = document.getElementById(`style-progress-${itemId}`);
            if (style) style.remove();
        }
    }

    showError(itemId, message, filename = '') {
        let li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (!li) {
            // Create a temporary error item if it doesn't exist
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
            // Update existing loading item
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

    onPlaylistSelect(id) {}
    onPlaylistDelete(id) {}
    onPlaylistRename(id, newName) {}
    onItemSelect(item) {}
    onItemPlay(item) {}
    onItemRemove(playlistId, itemId) {}
    onItemRename(itemId, newName) {}
}

window.uiManager = new UIManager();
