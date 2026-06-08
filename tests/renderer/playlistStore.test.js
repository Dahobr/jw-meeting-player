// tests/renderer/playlistStore.test.js

// Mock window before requiring the store
global.window = {};
require('../../src/renderer/js/playlistStore.js');
const playlistStore = window.PlaylistStore;

describe('PlaylistStore', () => {
    beforeEach(() => {
        playlistStore.init({ playlists: {} });
    });

    test('addItem should store sourceUrl and automatically set playlistId if missing', () => {
        playlistStore.addPlaylist('Test Playlist');
        const realId = playlistStore.currentPlaylistId;
        
        const item = {
            title: 'Test Item',
            sourceUrl: 'https://example.com/video.mp4'
            // playlistId is missing
        };
        
        playlistStore.addItem(realId, item);
        const storedItem = playlistStore.getItem(realId, item.id);
        
        expect(storedItem.sourceUrl).toBe('https://example.com/video.mp4');
        expect(storedItem.playlistId).toBe(realId);
    });
});
