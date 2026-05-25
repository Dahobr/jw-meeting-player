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
  setZoomSharing: (active, args) => ipcRenderer.send('set-zoom-sharing', active, args),

  // --- Zoom Automation ---
  openZoomSettings: () => ipcRenderer.invoke('open-zoom-settings'),
  spawnZoomProcess: (args) => ipcRenderer.invoke('spawn-zoom-process', args),
  onZoomProcStdout: (callback) => ipcRenderer.on('zoom-proc-stdout', (_event, data) => callback(data)),
  removeZoomStdoutListener: (callback) => ipcRenderer.removeListener('zoom-proc-stdout', callback),
  
  // --- Playback Events (Main -> Renderer) ---
  onLoadMedia: (callback) => ipcRenderer.on('load-media', (_event, data) => callback(data)),
  playbackReady: () => ipcRenderer.send('playback-ready'),
  onPlaybackCommand: (callback) => ipcRenderer.on('playback-command', (_event, data) => callback(data)),
  onMediaPlaybackStateChange: (callback) => ipcRenderer.on('media-playback-state-change', (_event, isPlaying) => callback(isPlaying)),
  onTriggerZoomSharingState: (callback) => ipcRenderer.on('trigger-zoom-sharing-state', (_event, isPlaying) => callback(isPlaying)),
  onZoomSharingReady: (callback) => ipcRenderer.on('zoom-sharing-ready', callback),
  onZoomSharingFinished: (callback) => ipcRenderer.on('zoom-sharing-finished', callback),
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
  getAboutContent: () => ipcRenderer.invoke('get-about-content'),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

  // --- File System Dialogs ---
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),
  openYearVerseFolder: () => ipcRenderer.invoke('open-year-verse-folder'),
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

window.addEventListener('click', (e) => {
    console.log('[Preload Debug] Click detected! target:', e.target);        

    // Attempt to find an anchor tag in the path or parent chain
    let target = e.target.closest('a');

    // If not found directly, check if the clicked element contains or is near a link (e.g. tooltip cases)
    if (!target) {
        target = e.target.querySelector('a') || (e.target.parentElement ? e.target.parentElement.closest('a') : null);
    }

    if (target) {
        console.log(`[Preload Debug] Link found: "${target.href}", text: "${target.textContent}"`);
        if (target.href && target.href.includes('/r5/lp-')) {
            const text = target.textContent;
            // Match "Cântico" or "Cantico"
            const match = text.match(/C[âã]ntico\s*(\d+)/i);
            if (match) {
                console.log(`[Preload] Song match found: ${match[1]}`);      
                ipcRenderer.send('wol-song-link-clicked', match[1]);

                // Stop the default site navigation
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }
}, true);
