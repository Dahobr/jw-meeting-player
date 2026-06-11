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
    downloadURL(url, id) {
        window.electronAPI.downloadURL(url, id);
    }

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

    cancelDownload(downloadId) {
        return window.electronAPI.cancelDownload(downloadId);
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

    setZoomSharing(active, args = []) {
        window.electronAPI.setZoomSharing(active, args);
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

    showPlaylistContextMenu(data) {
        window.electronAPI.showPlaylistContextMenu(data);
    }

    onMoveItem(callback) {
        window.electronAPI.onMoveItem(callback);
    }

    onShareResult(callback) {
        window.electronAPI.onShareResult(callback);
    }

    onPlaylistImported(callback) {
        window.electronAPI.onPlaylistImported(callback);
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

    async getAboutContent() {
        return await window.electronAPI.getAboutContent();
    }

    async deleteFile(filePath) {
        return await window.electronAPI.deleteFile(filePath);
    }

    async exportPlaylist(playlist) {
        return await window.electronAPI.exportPlaylist(playlist);
    }

    async deletePlaylistFolder(playlistId) {
        return await window.electronAPI.deletePlaylistFolder(playlistId);
    }

    // --- File System Dialogs ---
    async openDownloadFolder() {
        return await window.electronAPI.openDownloadFolder();
    }

    async openYearVerseFolder() {
        return await window.electronAPI.openYearVerseFolder();
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

    setActivePlaylist(playlistId) {
        window.electronAPI.setActivePlaylist(playlistId);
    }

    onDisplaysChanged(callback) {
        window.electronAPI.onDisplaysChanged(callback);
    }

    onDisplayStatus(callback) {
        window.electronAPI.onDisplayStatus(callback);
    }

    // --- App Closure & Reminders ---
    onConfirmClose(callback) {
        window.electronAPI.onConfirmClose(callback);
    }

    readyToClose() {
        window.electronAPI.readyToClose();
    }

    log(message) {
        window.electronAPI.log(message);
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
