/**
 * PlaylistListRenderer.js
 * Handles rendering of the playlist list UI.
 */
class PlaylistListRenderer {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        
        // Define Icons
        this.icons = {
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
            
            const btnEdit = DomUtils.query('.btn-edit-playlist', div);
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                this.callbacks.togglePlaylistEdit(id);
            });

            const btnDelete = DomUtils.query('.btn-delete-playlist', div);
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                this.callbacks.onPlaylistDelete(id);
            });
            
            const input = DomUtils.query('.edit-playlist-input', div);
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.callbacks.onPlaylistRename(id, input.value);
                    this.togglePlaylistEdit(id, false);
                }
            });
            input.addEventListener('blur', () => {
                this.togglePlaylistEdit(id, false);
            });
            
            this.container.appendChild(div);
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
}
