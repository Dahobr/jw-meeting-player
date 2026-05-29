/**
 * @fileoverview ViewRouter
 * Handles view state management and UI transitions,
 * offloading view-related logic from UIManager.
 */
class ViewRouter {
    constructor() {
        this.previewArea = DomUtils.get('preview-area');
        this.helpView = DomUtils.get('help-view');
        this.helpContainer = DomUtils.get('help-html-container');
        this.previewMediaWrapper = DomUtils.query('.preview-media-wrapper');
        this.previewControls = DomUtils.get('preview-controls-container');
        this.stateLabel = DomUtils.get('preview-state-label');
        this.viewPlaylists = DomUtils.get('view-playlists');
        this.viewItems = DomUtils.get('view-items');
    }

    /**
     * Centralized method to manage main content overlays.
     * @param {string} mode - The view mode to display: 'preview', 'help', or 'webview'.
     */
    updateMainOverlay(mode) {
        console.log(`[ViewRouter] updateMainOverlay: ${mode}`);
        const isPlaylist = this.isPlaylistView();

        // 1. Hide everything by default
        this.previewArea.style.display = 'none';
        this.helpView.style.display = 'none';
        
        // Native WebView visibility managed externally
        let webViewVisible = false;

        if (isPlaylist) {
            switch (mode) {
                case 'help':
                    this.helpView.style.display = 'flex';
                    break;
                case 'webview':
                    webViewVisible = true;
                    break;
                case 'preview':
                default:
                    this.previewMediaWrapper.style.display = 'none';
                    this.previewControls.style.display = 'none';
                    if (this.stateLabel) this.stateLabel.style.display = 'none';
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

    /**
     * Hides the preview area and restores the main content view.
     */
    hidePreview() {
        this.updateMainOverlay('guide');
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
}
window.ViewRouter = ViewRouter;
