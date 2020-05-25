"use strict";
const HOST = 'https://moongate.ryancody.io'
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const { FileReader } = require('./FileReader')
const { EventEmitter } = require('events')
const { net } = require('electron')
const path = require('path')

class FileManager {
    constructor(appPath) {
        this.dataPath = 'data'
        this.appPath = appPath
        this.serverState = {}
        this.localState = {}
        this.files = {}
        this.upToDate = false
        this.isWorking = false
        this.message = ''
        this.emitter = new EventEmitter()
        this.fileReader = new FileReader(this.appPath, this.dataPath)

        this.emitter.on('status', () => {
            //console.log('status fired!')
        })

        this.emitter.emit('status')
    }

    addStateUpdateListener(f) {
        try {
            this.emitter.addListener('status', f)
        }
        catch (e) {
            console.log(e)
        }
    }

    async checkStatus() {
        await this.getServerState()
        await this.compareStates()
    }

    async getUpdates() {
        await this.compareStates()
        await this.update()
        await this.compareStates()
    }

    getServerState() {

        return new Promise((resolve, reject) => {
            let request = net.request(`${HOST}/latest`)
            let buffer = []

            this.isWorking = true
            this.message = 'getting server state'
            this.emitter.emit('status')

            request.on('response', (response) => {

                response.on('data', (chunk) => {
                    buffer.push(chunk)
                })

                response.on('end', () => {
                    this.serverState = JSON.parse(buffer.toString())
                    this.message = 'server state received'
                    this.isWorking = false
                    this.emitter.emit('status')
                    resolve()
                })
            })
            request.end()
        })
    }

    async compareStates() {
        let localHashes = await this.fileReader.buildFileStatus(this.appPath, this.dataPath)
        this.isWorking = true
        this.message = 'comparing local files with server'
        this.emitter.emit('status')

        Object.keys(localHashes).forEach(key => {
            let cleanKey = key.replace(this.appPath, '').replace(/[\\]/g, '/') 
            if(cleanKey[0] === '/' || cleanKey[0] === '\\'){
                cleanKey = cleanKey.slice(1,cleanKey.length)
            }
            localHashes[cleanKey] = localHashes[key]
        })

        Object.keys(this.serverState).forEach(key => {
            
            if (localHashes[key] == this.serverState[key]) {
                this.files[key] = 1
            }
            else {
                this.files[key] = 0
                // console.log('not equal', localHashes[key], this.serverState[key])
            }
        })

        await this.runUpToDateCheck()
    }

    runUpToDateCheck() {
        return new Promise((resolve, reject) => {
            let b = true;

            Object.keys(this.files).forEach(key => {
                if (this.files[key] < 1) {
                    b = false
                }
            })

            this.upToDate = b
            this.isWorking = false

            if (this.upToDate) {
                this.message = "up to date!"
                this.emitter.emit('status')
            } else {
                this.message = 'updates available'
                this.emitter.emit('status')
            }
            resolve()
        })
    }

    getStatus() {
        return {
            files: this.files,
            upToDate: this.upToDate,
            isWorking: this.isWorking,
            message: this.message
        }
    }

    async update () {
        this.message = 'downloading updates'
        this.isWorking = true
        this.emitter.emit('status')

        let promises = []
        let needUpdates = Object.keys(this.files).filter(f => this.files[f] < 1)

        console.log(needUpdates.length + ' files need update')

        needUpdates.forEach(key => {
            promises.push(new Promise(async (resolve, reject) => {
                resolve(await this.getUpdatedData(key))
            }))
        })

        await Promise.all(promises)

        this.message = 'download complete'
        this.isWorking = false
        this.emitter.emit('status')
    }

    getUpdatedData (key) {
        
        return new Promise((resolve, reject) => {
            let data = {}

            if (this.files[key] === 0) {

                let request = net.request(`${HOST}/getFile?file=${key}`)
                let buffer = []

                request.on('response', (response) => {
                    let contentLength = response.headers['file-size']

                    response.on('data', (chunk) => {
                        buffer.push(chunk)
                        this.updateFileProgress(key, (buffer.toString('utf8').length / contentLength))
                    })

                    response.on('end', async () => {
                        data = Buffer.concat(buffer)

                        await writeFile(key, data)
                        this.updateFileProgress(key, 1)
                        resolve()
                    })
                })

                request.end()
            }
        })
    }

    updateFileProgress(key, progress) {
        this.files[key] = progress
        this.emitter.emit('status')
    }
}

exports.FileManager = FileManager