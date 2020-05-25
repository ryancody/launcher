const path = require('path')
const util = require('util')
const fs = require('fs')
const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const hash = require('./Hash')

class DirectoryReader {
    constructor (appPath, dataPath) {
        this.appPath = appPath 
        this.dataPath = dataPath
        this.fileArray = []
        
    }

    async listFilenamesRecursive (currentDir) {
        let objects = await readDir(currentDir)

        for (let i = 0; i < objects.length; i++) {
            objects[i] = path.join(currentDir, objects[i])
            let stat = fs.lstatSync(objects[i])
    
            try {
                if (stat.isFile()) {
                    this.fileArray.push(objects[i])
                }
                else if (stat.isDirectory()) {
                    let subObjects = await this.listFilenamesRecursive(objects[i])
                    this.fileArray.concat(subObjects)
                }
                else {
                    throw new Error(`${f} is neither file nor directory`)
                }
            }
            catch (err) {
                console.log(err)
            }
        }
    
        return this.fileArray
    }

    async buildFileStatus () {
        let files = []
        let fileHashes = {}
        
        files = await this.listFilenamesRecursive(path.join(appPath, this.dataPath))
        
        for (let i = 0; i < files.length; i++) {
            fileHashes[files[i]] = await hash.getHash(files[i])
        }
        
        return fileHashes
    }
    
    getFile = async (dataPath) => {
        let blob = await readFile(dataPath, { encoding: 'binary' })
        return blob
    }
}

exports.DirectoryReader = DirectoryReader