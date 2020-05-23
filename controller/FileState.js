const fileReader = require('./FileReader')
const net = require('electron').net
const EventEmitter = require('events')
const dataDir = 'data'

let serverState = {}
let localState = {
  files: {},
  upToDate: false,
  isDownloading: false,
  message: ''
}

const emitter = new EventEmitter();

emitter.on('stateUpdate', () => {
  //console.log('fired event')
})

exports.AddStateUpdateListener = (f) => {
  try {
    emitter.addListener('stateUpdate', f)
  }
  catch (e) {
    console.log(e)
  }
}

exports.localState = localState
exports.serverState = serverState

exports.checkStatus = async () => {

  await getServerState()
  await compareLocalToServer()
}

exports.updateFiles = async () => {
  localState.message = 'downloading files'

  await update()
  await compareLocalToServer()
}

getServerState = () => {
  localState.message = 'checking for updates'
  localState.isDownloading = true

  return new Promise((resolve, reject) => {

    let request = net.request('http://localhost:3000/latest')
    let buffer = []

    request.on('response', (response) => {

      response.on('data', (chunk) => {
        buffer.push(chunk)
      })

      response.on('end', async () => {
        serverState = JSON.parse(buffer.toString())
        localState.isDownloading = false
        resolve()
      })
    })
    request.end()
  })
}

compareLocalToServer = async () => {
  let localHashes = await fileReader.buildFileStatus(dataDir)

  Object.keys(serverState).forEach(key => {

    if (localHashes.hasOwnProperty(key) && localHashes[key] === serverState[key]) {
      localState.files[key] = 1
      emitter.emit('stateUpdate')
    }
    else {
      localState.files[key] = 0
    }
  })

  await runUpToDateCheck()
}

runUpToDateCheck = () => {
  return new Promise((resolve, reject) => {
    let b = true;

    Object.keys(localState.files).forEach(key => {
      if (localState.files[key] < 1) {
        b = false
      }
    })

    localState.upToDate = b

    if(localState.upToDate){
      localState.isDownloading = false;
      localState.message = "up to date!"
    }else {
      
      upToDateMessage = 'updates available'
    }

    emitter.emit('stateUpdate')

    resolve()
  })
}

update = async () => {
  let promises = []
  Object.keys(localState.files).forEach(key => {
    let p = new Promise((resolve, reject) => {
      getUpdatedData(key)
    })
    promises.push(p)
  })

  Promise.all(promises)
}

getUpdatedData = (key) => {
  let data = {}

  return new Promise((resolve, reject) => {

    if (localState.files[key] === 0) {

      let request = net.request(`http://localhost:3000/getFile?file=${key}`)
      let buffer = []

      request.on('response', (response) => {
        let contentLength = response.headers['file-size']

        response.on('data', (chunk) => {
          buffer.push(chunk)
          console.log((buffer.toString('utf8').length / contentLength))
          updateFileProgress(key, (buffer.toString('utf8').length / contentLength))
        })

        response.on('end', async () => {
          data = Buffer.concat(buffer)

          await writeFile(key, data)
          updateFileProgress(key, 1)
          resolve()
        })
      })

      request.end()
    }
  })
}

writeFile = async (key, data) => {

  await fileReader.updateFile(key, data, () => {
    emitter.emit('stateUpdate')
  })
}

updateFileProgress = (key, val) => {
  localState.files[key] = val
  emitter.emit('stateUpdate')
}
