/**
 * @fileoverview PlaylistListRenderer
 * Handles rendering of playlist lists, playlist items, and download status, 
 * offloading playlist-related DOM logic from UIManager.
 */
class PlaylistListRenderer {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.icons = {
            play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
            edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
            trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
        };
    }

    render(playlists, currentId) {
        this.container.innerHTML = '';
        Object.entries(playlists).forEach(([id, playlist]) => {
            const div = DomUtils.create('div', { className: `playlist-item ${id === currentId ? 'active' : ''}` });
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
                    this.callbacks.onPlaylistSelect(id);
                }
            });

            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (this.callbacks.onPlaylistContextMenu) {
                    this.callbacks.onPlaylistContextMenu(id, playlist);
                }
            });
            
            const btnEdit = DomUtils.query('.btn-edit-playlist', div);
            if (btnEdit) {
                btnEdit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.togglePlaylistEdit(id);
                });
            }

            const btnDelete = DomUtils.query('.btn-delete-playlist', div);
            if (btnDelete) {
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.callbacks.onPlaylistDelete(id);
                });
            }
            
            const input = DomUtils.query('.edit-playlist-input', div);
            if (input) {
                input.addEventListener('click', (e) => e.stopPropagation());
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.callbacks.onPlaylistRename(id, input.value);
                        this.togglePlaylistEdit(id, false);
                    }
                });
                input.addEventListener('blur', () => this.togglePlaylistEdit(id, false));
            }
            
            this.container.appendChild(div);
        });
    }

    renderItems(id, playlist, itemsList, currentPlaylistTitle) {
        currentPlaylistTitle.textContent = playlist.name;
        itemsList.innerHTML = '';
        
        if (playlist.items.length === 0) {
            itemsList.appendChild(DomUtils.create('li', { className: 'playlist-empty-msg', innerHTML: 'Nenhum item' }));
            return;
        }

        playlist.items.forEach((item, index) => {
            if (!item) return;
            const li = DomUtils.create('li', { className: 'playlist-item-li' });
            li.dataset.id = item.id;
            li.dataset.index = index;
            
            if (item.status === 'downloading') {
                li.classList.add('downloading');
                li.innerHTML = `
                    <div class="item-content">
                        <div class="item-thumbnail loading" style="--progress: ${item.progress || 0}%;"></div>
                        <div class="item-info">
                            <span class="item-title">${item.title || item.filename}</span>
                            <span class="item-type">Baixando... (${item.progress || 0}%)</span>
                        </div>
                    </div>
                `;
                itemsList.appendChild(li);
                return;
            }

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
                    this.callbacks.onItemSelect(item);
                }
            });
            
            DomUtils.query('.btn-play-item', li).addEventListener('click', (e) => {
                e.stopPropagation();
                this.callbacks.onItemPlay(item);
            });

            const moreActions = DomUtils.query('.item-more-actions', li);
            const dropdown = DomUtils.query('.item-dropdown', li);
            moreActions.addEventListener('click', (e) => {
                e.stopPropagation();
                DomUtils.queryAll('.item-dropdown.show', itemsList).forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });

            DomUtils.query('.btn-edit-item', li).addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('show');
                this.toggleItemEdit(item.id);
            });
            
            DomUtils.query('.btn-delete-item', li).addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('show');
                this.callbacks.onItemRemove(id, item.id);
            });

            const input = DomUtils.query('.edit-item-input', li);
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.callbacks.onItemRename(item.id, input.value);
                    this.toggleItemEdit(item.id, false);
                }
            });
            input.addEventListener('blur', () => this.toggleItemEdit(id, false));
            
            itemsList.appendChild(li);
        });
    }

    renderDownloadItem(itemId, filename, itemsList) {
        const li = DomUtils.create('li', { className: 'playlist-item-li downloading' });
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
        itemsList.appendChild(li);
    }

    updateDownloadProgress(itemId, percentage, itemsList) {
        const li = DomUtils.query(`li[data-id="${itemId}"]`, itemsList);
        if (li) {
            li.dataset.progress = percentage;
            const thumbnail = DomUtils.query('.item-thumbnail', li);
            if (thumbnail) {
                thumbnail.style.setProperty('--progress', percentage);
                if (percentage >= 100) {
                    thumbnail.classList.remove('loading');
                }
            }
        }
    }

    removeDownloadItem(itemId, itemsList) {
        const li = DomUtils.query(`li[data-id="${itemId}"]`, itemsList);
        if (li) {
            li.remove();
        }
    }

    updatePlaybackStateUI(config, itemsList) {
        const { statusLabel, statusClass, items } = config;

        // Note: statusLabel and statusClass handling would likely need to be handled by UIManager
        // or passed as parameters if they affect elements outside the playlist list container.
        // Assuming they are updated in UIManager.

        const liElements = DomUtils.queryAll(".playlist-item-li", itemsList);
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

    togglePlaylistEdit(id, show = true) {
        const nameSpan = DomUtils.get(`name-${id}`);
        const input = DomUtils.get(`input-${id}`);
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
        const nameSpan = DomUtils.get(`item-name-${id}`);
        const input = DomUtils.get(`item-input-${id}`);
        if (nameSpan && input) {
            nameSpan.style.display = show ? 'none' : 'block';
            input.style.display = show ? 'block' : 'none';
            if (show) input.focus();
        }
    }
}
window.PlaylistListRenderer = PlaylistListRenderer;
