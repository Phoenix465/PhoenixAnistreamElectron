// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron')

let SearchAnimeReceiverListener;
contextBridge.exposeInMainWorld('electronAPI', {
    GetLatestData: () => ipcRenderer.invoke('webscraper-GetLatestData'),
    GetAnimeIcon: (url) => ipcRenderer.invoke('GetAnimeIcon', url),
    SearchAnime: (query) => ipcRenderer.send('SearchAnime', query),
    SearchAnimeReceiver: (callback) => SearchAnimeReceiverListener = callback,
    SearchAnimeCancel: () => ipcRenderer.send("SearchAnimeCancel")
})

ipcRenderer.on("SearchAnimeReceiver", function(event, data) {
    if (SearchAnimeReceiverListener) {
        SearchAnimeReceiverListener(data);
    } else {
        console.warn('No listener');
    }
})