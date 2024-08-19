import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  send(channel: string, value?: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  login: (credentials) => ipcRenderer.send('login', credentials),
  logout: () => ipcRenderer.send('logout'),
  getSetting: () => ipcRenderer.send('getSetting'),
  getSession: () => ipcRenderer.send('getSession'),
  putSongData: (songData) => ipcRenderer.send('putSongData', songData),
  getSongData: () => ipcRenderer.send('getSongData'),
  removeListener: (channel, subscription) => ipcRenderer.removeListener(channel, subscription),
  openBrowser: (url) => ipcRenderer.send('openBrowser', url),
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
