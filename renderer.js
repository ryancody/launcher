// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const statusDiv = document.getElementById('statusDiv')
const actionButtonDiv = document.getElementById('actionButtonDiv')

const playButton = document.createElement('button')
playButton.className = 'button'
playButton.appendChild(document.createTextNode('Play'))

const updateButton = document.createElement('button')
updateButton.className = 'button'
updateButton.appendChild(document.createTextNode('Update'))

const loadingButton = document.createElement('button')
loadingButton.className = 'button is-loading is-static'
loadingButton.appendChild(document.createTextNode('Updating'))

const statusMessage = document.createElement('p')
statusMessage.appendChild(document.createTextNode('checking for updates'))

const errorMessage = document.createElement('p')
errorMessage.appendChild(document.createTextNode('error!  unexpected local file state'))

let getStatusMessage = (localState) => {
    statusMessage.textContent = localState.message

    if(localState.isWorking){
        let table = document.createElement('table')
        table.className = 'table'
        statusMessage.appendChild(table)

        Object.keys(localState.files).filter(f => localState.files[f] < 1).forEach(f => {
            let row = table.insertRow()
            let progress = row.insertCell(0)
            let label = row.insertCell(1)

            label.innerHTML = f
            progress.innerHTML = (localState.files[f] * 100).toFixed(0) + '%'
        })
    }
}

let getActionButton = (localState) => {
    if(localState.isWorking){
        return loadingButton
    } else {

        if(localState.upToDate) {
            return playButton
        }
        else {
            return updateButton
        }
    }
}

let updateContainer = (container, child) => {

    if(container.children.length === 0){
        container.appendChild(child)
    } else {
        container.replaceChild(child, container.firstChild)
    }
}

let OnStateUpdate = (localState) => {
    let button = getActionButton(localState)
    updateContainer(actionButtonDiv, button)
    
    getStatusMessage(localState)
}

ipcRenderer.on('stateUpdate', (event, message) => {
    //console.log('message',message)

    OnStateUpdate(message)
})

updateContainer(statusDiv, statusMessage)
updateContainer(actionButtonDiv, loadingButton)

updateButton.onclick = () => {
    ipcRenderer.send('updateButtonClick')
}

playButton.onclick = () => {
    ipcRenderer.send('playButtonClick')
}