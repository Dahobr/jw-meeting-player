const { contextBridge, ipcRenderer, webFrame } = require('electron');

/**
 * The IPC bridge between Main and Renderer processes.
 * Every channel used in the application must be explicitly defined here.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // --- Navigation ---
  navigateSite: (key) => ipcRenderer.send('navigate-site', key),
  onTriggerNavigation: (callback) => ipcRenderer.on('trigger-navigation', (_event, url) => callback(url)),

  // --- Downloads ---
  onDownloadStarted: (callback) => ipcRenderer.on('download-started', (_event, data) => callback(data)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, data) => callback(data)),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (_event, data) => callback(data)),
  onDownloadError: (callback) => ipcRenderer.on('download-error', (_event, data) => callback(data)),

  // --- Playback Control (Renderer -> Main) ---
  loadMedia: (data) => ipcRenderer.send('load-media', data),
  playbackControl: (data) => ipcRenderer.send('playback-control', data),
  mediaPlaybackStateChange: (isPlaying) => ipcRenderer.send('media-playback-state-change', isPlaying),
  updateZoomSharingState: (isSharing) => ipcRenderer.send('update-zoom-sharing-state', isSharing),

  // --- Playback Events (Main -> Renderer) ---
  onLoadMedia: (callback) => ipcRenderer.on('load-media', (_event, data) => callback(data)),
  playbackReady: () => ipcRenderer.send('playback-ready'),
  onPlaybackCommand: (callback) => ipcRenderer.on('playback-command', (_event, data) => callback(data)),
  onMediaPlaybackStateChange: (callback) => ipcRenderer.on('media-playback-state-change', (_event, isPlaying) => callback(isPlaying)),
  onTriggerZoomSharingState: (callback) => ipcRenderer.on('trigger-zoom-sharing-state', (_event, isPlaying) => callback(isPlaying)),
  onZoomSharingReady: (callback) => ipcRenderer.on('zoom-sharing-ready', callback),
  onSetPlaybackPlaylist: (callback) => ipcRenderer.on('set-playback-playlist', (_event, data) => callback(data)),

  // --- UI & View State ---
  updateViewBounds: (bounds) => ipcRenderer.send('update-view-bounds', bounds),
  toggleWebView: (visible) => ipcRenderer.send('toggle-webview', visible),
  showItemContextMenu: (data) => ipcRenderer.send('show-item-context-menu', data),
  onMoveItem: (callback) => ipcRenderer.on('move-item', (_event, data) => callback(data)),

  // --- Storage ---
  savePlaylists: (data) => ipcRenderer.send('save-playlists', data),
  loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
  getHelpContent: () => ipcRenderer.invoke('get-help-content'),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

  // --- File System Dialogs ---
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),
  openYearVerseFolder: () => ipcRenderer.invoke('open-year-verse-folder'),
  openZoomAssetsFolder: () => ipcRenderer.invoke('open-zoom-assets-folder'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  getYearVerseImage: () => ipcRenderer.invoke('get-year-verse-image'),
  selectYearVerseImage: () => ipcRenderer.invoke('select-year-verse-image'),
  loadYearVerseImagePath: () => ipcRenderer.invoke('load-year-verse-image-path'),
  onYearVerseImageUpdated: (callback) => ipcRenderer.on('year-verse-image-updated', (_event, imagePath) => callback(imagePath)),

  // --- Displays ---
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setTargetDisplay: (displayId) => ipcRenderer.send('set-target-display', displayId),
  requestDisplayStatus: () => ipcRenderer.invoke('request-display-status'),
  onDisplaysChanged: (callback) => ipcRenderer.on('displays-changed', () => callback()),
  onDisplayStatus: (callback) => ipcRenderer.on('display-status', (_event, status) => callback(status)),
  saveBrowserImage: (data, url) => ipcRenderer.send('save-browser-image', data, url),
  onRequestSaveImage: (callback) => ipcRenderer.on('request-save-browser-image', (_event, url) => callback(url)),

  // --- Config Management ---
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
});

// Set default zoom factor to ensure consistency
webFrame.setZoomFactor(1.0);
