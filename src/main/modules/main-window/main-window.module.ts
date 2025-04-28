import { BrowserWindow, app } from 'electron'

import { ElectronModule } from '@doubleshot/nest-electron'
import { Module } from '@nestjs/common'
import path, { join } from 'node:path'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { MainWindowController } from './main-window.controller'
import { MainWindowService } from './main-window.service'

@Module({
  imports: [
    FileManagerModule,
    ElectronModule.registerAsync({
      useFactory: () => {
        const isDev = !app.isPackaged
        const preloadPath = isDev
          ? join(app.getAppPath(), '../preload/index.js')
          : join(app.getAppPath(), 'dist/preload/index.js')
        const win = new BrowserWindow({
          width: 1280,
          height: 720,
          minWidth: 1280,
          minHeight: 720,
          frame: false,
          autoHideMenuBar: true,
          transparent: false,
          backgroundColor: '#f0f4f8',
          icon: path.join(__dirname + '/../../resources/', 'icon.png'),
          webPreferences: {
            contextIsolation: true,
            preload: preloadPath,
          },
        })

        win.on('closed', () => {
          win.destroy()
        })

        const URL = isDev
          ? `${process.env.DS_RENDERER_URL}#/home`
          : `file://${join(app.getAppPath(), 'dist/render/index.html')}#/home`

        win.loadURL(URL)

        return { win }
      },
    }),
  ],
  controllers: [MainWindowController],
  providers: [MainWindowService],
  exports: [MainWindowService],
})
export class MainWindowModule {}
