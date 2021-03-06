// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const webscraper = require("./webscraper.js");
const path = require('path')
const env = process.env.NODE_ENV || 'development';

const ignoredCache = /cache|[\/\\]\./;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 720,
        height: 480,
        icon: path.join(__dirname, 'resources', 'PhoenixAniStream.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()
}

// If development environment
if (env === 'development') {
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true,
            ignore: [ignoredCache]
        });
    } catch (error) { console.log('Error', error); }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle("webscraper-GetLatestData", async (event, ...args) => {
    return webscraper.GetLatestData();
})

ipcMain.handle("GetAnimeIcon", async (event, url, ...args) => {
    return webscraper.GetAnimeIcon(url);
})

ipcMain.on("SearchAnime", async (event, query, ...args) => {
    await webscraper.SearchAnime(query, event);
})

ipcMain.on("SearchAnimeCancel", async (event, query, ...args) => {
    webscraper.SearchAnimeCancel();
})