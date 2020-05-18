const fileReader = require('./FileReader')
const { net } = require('electron')
let localStatus = {}

exports.localStatus = localStatus

exports.compareToLocal = async (data) => {
  let localData = await fileReader.buildFileStatus('testData')
    console.log('localstatuscheck', localStatus)
  //console.log('data', data)
  //console.log('localData', localData)

  Object.keys(localData).forEach(key => {
    
    if(data.hasOwnProperty(key) && data[key] === localData[key]){
      localStatus[key] = 1
    }
    else {
      localStatus[key] = 0
    }
  })
}

exports.checkStatus = () => {
    return new Promise((resolve, reject) => {
      let request = net.request('http://localhost:3000/latest')
      let buffer = []
  
      request.on('response', (response) => {
        
        response.on('data', (chunk) => {
          buffer.push(chunk)
        })
    
        response.on('end', async () => {
          let data = JSON.parse(buffer.toString())
          await this.compareToLocal(data)
          resolve(localStatus)
        })
      })
      request.end()
    })
  }


/*   Buffer example
ipcMain.on('getFileState', (event, arg) => {
  let request = net.request('http://localhost:3000/latest')
  let buffer = []

  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`)
    console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
    
    response.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`)
      event.sender.send('getFileState-Response', data)
    })

    response.on('end', () => {
      let data = Buffer.concat(buffer)
      console.log(data)
      event.sender.send('getFileState-Response', data)
    })
  })
  request.end()
})
*/