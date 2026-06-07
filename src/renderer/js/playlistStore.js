/**
 * playlistStore.js
 * Renderer Data Layer - Single Source of Truth for Playlists
 *
 * This class manages the state of playlists and items in the renderer process.
 * It provides methods for data manipulation and follows a listener pattern to
 * notify the UI layer when changes occur.
 */

class PlaylistStore {
  constructor() {
    this.playlists = {};
    this.currentPlaylistId = null;
    this.listeners = [];
  }

  /**
   * Subscribe to store changes.
   * @param {Function} callback - Called whenever the state changes.
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Notify all subscribers that the state has changed.
   * @private
   */
  _notify() {
    const state = this.getState();
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Get the current state of the store.
   * @returns {Object} { playlists, currentPlaylistId }
   */
  getState() {
    return {
      // Return a shallow copy of playlists to encourage immutability-like behavior
      playlists: { ...this.playlists },
      currentPlaylistId: this.currentPlaylistId
    };
  }

  /**
   * Initialize the store with existing data.
   * @param {Object} data - Initial state (usually from storageManager via IPC).
   */
  init(data) {
    if (data && data.playlists && Object.keys(data.playlists).length > 0) {
      this.playlists = data.playlists;
      this.currentPlaylistId = data.currentPlaylistId || Object.keys(this.playlists)[0];
    } else {
      // Default initial state if no data is present
      const defaultId = `playlist-${Date.now()}`;
      this.playlists = {
        [defaultId]: { name: 'Minha Playlist', items: [] }
      };
      this.currentPlaylistId = defaultId;
    }
    this._notify();
  }

  /**
   * Add a new empty playlist.
   * @param {string} name - Name of the playlist.
   * @returns {string} The ID of the newly created playlist.
   */
  addPlaylist(name) {
    const id = `playlist-${Date.now()}`;
    this.playlists[id] = {
      name: name || 'Nova Playlist',
      items: []
    };
    this.currentPlaylistId = id;
    this._notify();
    return id;
  }

  /**
   * Delete a playlist by ID.
   * @param {string} id 
   * @returns {Array} List of items that were in the deleted playlist.
   */
  deletePlaylist(id) {
    if (this.playlists[id]) {
      const items = [...this.playlists[id].items];
      delete this.playlists[id];
      // Re-assign currentPlaylistId if the deleted one was active
      if (this.currentPlaylistId === id) {
        const remainingIds = Object.keys(this.playlists);
        this.currentPlaylistId = remainingIds.length > 0 ? remainingIds[0] : null;
      }
      this._notify();
      return items;
    }
    return [];
  }

  /**
   * Get an item by ID from a specific playlist.
   * @param {string} playlistId 
   * @param {string} itemId 
   * @returns {Object|null}
   */
  getItem(playlistId, itemId) {
    if (this.playlists[playlistId]) {
      return this.playlists[playlistId].items.find(item => item && item.id === itemId) || null;
    }
    return null;
  }

  /**
   * Rename a playlist.
   * @param {string} id 
   * @param {string} newName 
   */
  renamePlaylist(id, newName) {
    if (this.playlists[id] && newName && newName.trim()) {
      this.playlists[id].name = newName.trim();
      this._notify();
    }
  }

  /**
   * Set the current active playlist.
   * @param {string} id 
   */
  setCurrentPlaylistId(id) {
    if (this.playlists[id]) {
      this.currentPlaylistId = id;
      this._notify();
    }
  }

  /**
   * Add an item to a playlist.
   * @param {string} playlistId - ID of the playlist (defaults to current).
   * @param {Object} item - The item object to add.
   */
  addItem(playlistId, item) {
    const targetId = playlistId || this.currentPlaylistId;
    if (this.playlists[targetId]) {
      // Ensure the item has a unique ID for tracking
      if (!item.id) {
        item.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      if (!item.playlistId) {
        item.playlistId = targetId;
      }
      this.playlists[targetId].items.push(item);
      this._notify();
    }
  }

  /**
   * Remove an item from a playlist.
   * @param {string} playlistId - ID of the playlist (defaults to current).
   * @param {string} itemId - ID of the item to remove.
   */
  removeItem(playlistId, itemId) {
    const targetId = playlistId || this.currentPlaylistId;
    if (this.playlists[targetId]) {
      this.playlists[targetId].items = this.playlists[targetId].items.filter(item => item && item.id !== itemId);
      this._notify();
    }
  }

  /**
   * Move an item between playlists.
   * @param {string} itemId 
   * @param {string} targetPlaylistId - The destination playlist ID or 'new'.
   */
  moveItem(itemId, targetPlaylistId) {
    const source = this._findItem(itemId);
    if (!source) return;

    if (targetPlaylistId === 'new') {
      targetPlaylistId = this.addPlaylist('Nova Playlist');
    }

    if (this.playlists[targetPlaylistId]) {
      // Remove from source
      this.playlists[source.playlistId].items.splice(source.index, 1);
      // Add to target
      this.playlists[targetPlaylistId].items.push(source.item);
      this._notify();
    }
  }

  /**
   * Internal helper to find an item across all playlists.
   * @private
   * @param {string} itemId 
   * @returns {Object|null} { playlistId, index, item }
   */
  _findItem(itemId) {
    for (const pid in this.playlists) {
      const index = this.playlists[pid].items.findIndex(item => item && item.id === itemId);
      if (index !== -1) {
        return {
          playlistId: pid,
          index: index,
          item: this.playlists[pid].items[index]
        };
      }
    }
    return null;
  }

  /**
   * Update item properties (e.g., status, name).
   * @param {string} itemId 
   * @param {Object} updates 
   */
  updateItem(itemId, updates) {
    const result = this._findItem(itemId);
    if (result) {
      Object.assign(result.item, updates);
      this._notify();
    }
  }

  /**
   * Reorder items within a playlist.
   * @param {string} playlistId 
   * @param {number} oldIndex 
   * @param {number} newIndex 
   */
  reorderItems(playlistId, oldIndex, newIndex) {
    const playlist = this.playlists[playlistId];
    if (playlist && playlist.items) {
      const items = playlist.items;
      const [movedItem] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, movedItem);
      this._notify();
    }
  }
}

// Attach to window for global access in the renderer process
if (typeof window !== 'undefined') {
  window.PlaylistStore = new PlaylistStore();
}

if (typeof module !== 'undefined') {
  module.exports = PlaylistStore;
}
