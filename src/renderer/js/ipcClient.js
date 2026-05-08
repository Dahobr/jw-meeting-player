/**
 * ipcClient.js
 * Renderer IPC Client - Abstraction layer for Electron API calls.
 */

class IPCClient {
    // --- Navigation ---
    navigateSite(key) {
        window.electronAPI.navigateSite(key);
    }

    onTriggerNavigation(callback) {
        window.electronAPI.onTriggerNavigation(callback);
    }

    // --- Downloads ---
    onDownloadStarted(callback) {
        window.electronAPI.onDownloadStarted(callback);
    }

    onDownloadProgress(callback) {
        window.electronAPI.onDownloadProgress(callback);
    }

    onDownloadComplete(callback) {
        window.electronAPI.onDownloadComplete(callback);
    }

    onDownloadError(callback) {
        window.electronAPI.onDownloadError(callback);
    }

    // --- Playback Control ---
    loadMedia(data) {
        window.electronAPI.loadMedia(data);
    }

    playbackControl(data) {
        window.electronAPI.playbackControl(data);
    }

    mediaPlaybackStateChange(isPlaying) {
        window.electronAPI.mediaPlaybackStateChange(isPlaying);
    }

    updateZoomSharingState(isSharing) {
        window.electronAPI.updateZoomSharingState(isSharing);
    }

    onLoadMedia(callback) {
        window.electronAPI.onLoadMedia(callback);
    }

    onPlaybackCommand(callback) {
        window.electronAPI.onPlaybackCommand(callback);
    }

    onMediaPlaybackStateChange(callback) {
        window.electronAPI.onMediaPlaybackStateChange(callback);
    }

    onTriggerZoomSharingState(callback) {
        window.electronAPI.onTriggerZoomSharingState(callback);
    }

    onSetPlaybackPlaylist(callback) {
        window.electronAPI.onSetPlaybackPlaylist(callback);
    }

    // --- UI & View State ---
    updateViewBounds(bounds) {
        window.electronAPI.updateViewBounds(bounds);
    }

    toggleWebView(visible) {
        window.electronAPI.toggleWebView(visible);
    }

    showItemContextMenu(data) {
        window.electronAPI.showItemContextMenu(data);
    }

    onMoveItem(callback) {
        window.electronAPI.onMoveItem(callback);
    }

    // --- Storage ---
    savePlaylists(data) {
        window.electronAPI.savePlaylists(data);
    }

    async loadPlaylists() {
        return await window.electronAPI.loadPlaylists();
    }

    async getHelpContent() {
        return await window.electronAPI.getHelpContent();
    }

    async deleteFile(filePath) {
        return await window.electronAPI.deleteFile(filePath);
    }

    // --- File System Dialogs ---
    async openDownloadFolder() {
        return await window.electronAPI.openDownloadFolder();
    }

    async openYearVerseFolder() {
        return await window.electronAPI.openYearVerseFolder();
    }

    async openZoomAssetsFolder() {
        return await window.electronAPI.openZoomAssetsFolder();
    }

    async openFileDialog() {
        return await window.electronAPI.openFileDialog();
    }

    async getYearVerseImage() {
        return await window.electronAPI.getYearVerseImage();
    }

    async selectYearVerseImage() {
        return await window.electronAPI.selectYearVerseImage();
    }

    async loadYearVerseImagePath() {
        return await window.electronAPI.loadYearVerseImagePath();
    }

    onYearVerseImageUpdated(callback) {
        window.electronAPI.onYearVerseImageUpdated(callback);
    }

    // --- Displays ---
    async getDisplays() {
        return await window.electronAPI.getDisplays();
    }

    setTargetDisplay(displayId) {
        window.electronAPI.setTargetDisplay(displayId);
    }

    requestDisplayStatus() {
        return window.electronAPI.requestDisplayStatus();
    }

    onRequestSaveImage(callback) {
        window.electronAPI.onRequestSaveImage(callback);
    }

    saveBrowserImage(base64Data, originalUrl) {

        window.electronAPI.saveBrowserImage(base64Data, originalUrl);
    }

    onDisplaysChanged(callback) {
        window.electronAPI.onDisplaysChanged(callback);
    }

    onDisplayStatus(callback) {
        window.electronAPI.onDisplayStatus(callback);
    }

    // --- Config Management ---
    async getConfig() {
        return await window.electronAPI.getConfig();
    }

    async updateConfig(config) {
        return await window.electronAPI.updateConfig(config);
    }
}

window.ipcClient = new IPCClient();
