/**
 * playback.js
 * Renderer for the Playback Window.
 */

const videoPlayer = document.getElementById('video-player');
const imageViewer = document.getElementById('image-viewer');
const yearVerseViewer = document.getElementById('year-verse-viewer');
const errorMessageDiv = document.getElementById('error-message');
const loadingIndicator = document.getElementById('loading-indicator');

let isPlaying = false;

// --- Helper: Ensure only one viewer is visible ---
function showOnly(activeElement) {
    console.log(`[Playback] showOnly called. Active: ${activeElement ? activeElement.id : 'None'}`);
    [videoPlayer, imageViewer, yearVerseViewer, errorMessageDiv].forEach(el => {
        if (el) {
            const shouldBeShown = (el === activeElement);
            el.style.display = shouldBeShown ? 'block' : 'none';
            console.log(`[Playback] Element ${el.id} set to: ${el.style.display}`);
        }
    });
}

function updatePlaybackState(newState) {
    isPlaying = newState;
    window.electronAPI.mediaPlaybackStateChange(newState);
}

function showError(message) {
    console.error(`[Playback] Error: ${message}`);
    loadingIndicator.style.display = 'none';
    errorMessageDiv.textContent = message;
    showOnly(errorMessageDiv);
    updatePlaybackState(false);
}

function showLoadingIndicator() {
    loadingIndicator.style.display = 'block';
}

function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

/**
 * Show the Year Verse as a standby image.
 */
async function showStandby() {
    console.log('[Playback] Showing standby (Year Verse)...');
    
    videoPlayer.pause();
    videoPlayer.src = "";
    videoPlayer.load();
    
    const path = await window.electronAPI.loadYearVerseImagePath();
    if (path) {
        yearVerseViewer.src = `media://app/${path.replace(/\\/g, '/')}`;
        showOnly(yearVerseViewer);
    } else {
        console.log('[Playback] No Year Verse found, showing black screen.');
        showOnly(null);
    }
    
    hideLoadingIndicator();
    // updatePlaybackState(false); 
}

// --- Media Loading Logic ---
function loadMediaItem(mediaPath, mediaType, autoPlay = true, startTime = 0) {
    console.log(`[Playback] loadMediaItem: ${mediaPath} (Type: ${mediaType}, AutoPlay: ${autoPlay}, StartTime: ${startTime})`);
    showLoadingIndicator();
    
    const normalizedPath = mediaPath.replace(/\\/g, '/');
    const safeUrl = `media://app/${normalizedPath}`;
    
    const isVideo = mediaType.includes('video') || mediaPath.toLowerCase().endsWith('.mp4');
    const isImage = mediaType.includes('image') || 
                    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(mediaPath);

    if (isVideo) {
        console.log(`[Playback] Transitioning to video. Current video.src: ${videoPlayer.src}, image.src: ${imageViewer.src}`);
        
        // Force clear image viewer
        imageViewer.src = "";
        
        console.log(`[Playback] Setting video src to: ${safeUrl}`);
        videoPlayer.src = safeUrl;
        showOnly(videoPlayer);
        
        // Sync starting position after metadata is loaded
        const onMetadata = () => {
            if (startTime > 0) {
                console.log(`[Playback] Syncing startTime: ${startTime}`);
                videoPlayer.currentTime = startTime;
            }
            videoPlayer.removeEventListener('loadedmetadata', onMetadata);
            
            if (autoPlay) {
                console.log('[Playback] Attempting auto-play after metadata load');
                videoPlayer.play().catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error('[Playback] Play failed:', error);
                        showError(`Erro ao reproduzir vídeo: ${error.message || error.name}`);
                    }
                });
            } else {
                hideLoadingIndicator();
                updatePlaybackState(false);
            }
        };
        videoPlayer.addEventListener('loadedmetadata', onMetadata);
        
        videoPlayer.load();
    } else if (isImage) {
        console.log(`[Playback] Setting image src to: ${safeUrl}`);
        imageViewer.src = safeUrl;
        showOnly(imageViewer);
        videoPlayer.pause();
        videoPlayer.src = "";
    } else {
        showError(`Tipo de arquivo não suportado: ${mediaType}`);
    }
}

window.electronAPI.onLoadMedia((data) => {
    // Expecting data to have { mediaPath, mediaType, autoPlay, startTime }
    loadMediaItem(data.mediaPath, data.mediaType, data.autoPlay !== false, data.startTime || 0);
});

// --- Playback Control Commands ---
window.electronAPI.onPlaybackCommand(({ action, ...data }) => {
    console.log(`[Playback] Command received: ${action}`);
    
    if (action === 'stop') {
        showStandby();
        return;
    }

    if (action === 'set-volume') {
        videoPlayer.volume = data.volume;
        return;
    }

    if (action === 'toggle-fullscreen') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
        return;
    }

    // Safety for video actions
    if (!videoPlayer.src || videoPlayer.src === window.location.href) return;

    const safePlay = () => videoPlayer.play().catch(err => { if(err.name !== 'AbortError') showError(err.message); });

    switch (action) {
        case 'toggle-play-pause':
            if (videoPlayer.paused) safePlay();
            else videoPlayer.pause();
            break;
        case 'play':
            safePlay();
            break;
        case 'pause':
            videoPlayer.pause();
            break;
        case 'seek':
            console.log(`[Playback] Received seek command. Time: ${data.time}, CurrentTime: ${videoPlayer.currentTime}`);
            videoPlayer.currentTime = data.time;
            console.log(`[Playback] Seek command applied. New CurrentTime: ${videoPlayer.currentTime}`);
            break;
    }
});

// --- Listeners ---
videoPlayer.addEventListener('play', () => {
    hideLoadingIndicator();
    updatePlaybackState(true);
});
videoPlayer.addEventListener('pause', () => updatePlaybackState(false));
videoPlayer.addEventListener('ended', () => {
    console.log('[Playback] Video ended. Triggering stop/standby.');
    window.electronAPI.playbackControl({ action: 'stop' });
});
videoPlayer.addEventListener('error', () => {
    // Ignore errors when src is not set or is the page itself
    if (!videoPlayer.src || videoPlayer.src === window.location.href || videoPlayer.src === 'media://app/') return;
    
    const error = videoPlayer.error;
    if (error && (error.code === 3 || error.code === 4)) {
        if (loadingIndicator.style.display === 'block') return;
        console.log('[Playback] Attempting auto-recovery...');
        showLoadingIndicator();
        const currentTime = videoPlayer.currentTime;
        setTimeout(() => {
            videoPlayer.load();
            videoPlayer.currentTime = currentTime;
            videoPlayer.play().then(() => hideLoadingIndicator()).catch(() => hideLoadingIndicator());
        }, 500);
        return;
    }
    showError(`Erro no player de vídeo: ${error ? error.message : 'Unknown'}`);
});

imageViewer.onload = () => {
    if (!imageViewer.src || imageViewer.src === window.location.href) return;
    hideLoadingIndicator();
    updatePlaybackState(true);
};
imageViewer.onerror = () => {
    // Ignore error if src is empty or just the app root (resetting state)
    if (!imageViewer.src || imageViewer.src === window.location.href || imageViewer.src.endsWith('/') || imageViewer.src === 'media://app/') {
        return;
    }
    showError(`Erro ao carregar imagem: ${imageViewer.src}`);
};

// Initial state
showStandby();
console.log('[Playback] Renderer initialized.');
