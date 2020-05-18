// Modules to control application life and create native browser window
const { app, BrowserWindow, net } = require('electron')
const path = require('path')
const fileStateManager = require('./controller/FileStateManager')
const { ipcMain } = require('electron')

let mainWindow


function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    nodeIntegration: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  checkFileStatus()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('getFileState', (event, arg) => {
  checkFileStatus()
})

let checkFileStatus = () => {
  let request = net.request('http://localhost:3000/latest')

  request.on('response', (response) => {
    
    response.on('data', async (chunk) => {
      let data = JSON.parse(chunk.toString())

      let fileStatus = await fileStateManager.compareToLocal(data)
      console.log(fileStatus)
    })

    response.on('end', () => {
      // console.log('filestate received')
    })
  })
  request.end()
}