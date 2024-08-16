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
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  getSession: () => ipcRenderer.invoke('get-session'),
  putSongData: (songData) => ipcRenderer.invoke('putSongData', songData),
  getSongData: () => ipcRenderer.invoke('getSongData'),
  removeListener: (channel, subscription) => ipcRenderer.removeListener(channel, subscription),
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
