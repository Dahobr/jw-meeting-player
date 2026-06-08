// tests/main/storageManager.test.js
const storageManager = require('../../src/main/storageManager');
const path = require('path');
const fs = require('fs');

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn().mockReturnValue('mock-user-data'),
        getAppPath: jest.fn().mockReturnValue('mock-app-path')
    },
    ipcMain: {
        on: jest.fn(),
        handle: jest.fn(),
        removeHandler: jest.fn(),
        removeAllListeners: jest.fn()
    },
    shell: { openPath: jest.fn() },
    dialog: { showOpenDialog: jest.fn() }
}));

describe('StorageManager', () => {
    test('getPlaylistDownloadsDir should return path with playlistId and ensure it exists', () => {
        const playlistId = 'playlist-123';
        const expectedPath = path.join(storageManager.downloadsDir, playlistId);
        
        // Mock fs.existsSync and fs.mkdirSync
        const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

        const result = storageManager.getPlaylistDownloadsDir(playlistId);
        
        expect(result).toBe(expectedPath);
        expect(mkdirSyncSpy).toHaveBeenCalledWith(expectedPath, { recursive: true });
        
        existsSyncSpy.mockRestore();
        mkdirSyncSpy.mockRestore();
    });
});
