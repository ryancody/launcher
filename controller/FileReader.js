const path = require('path')
const util = require('util')
const fs = require('fs')
const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const hash = require('./Hash')

exports.listFilenamesRecursive = async (currentDir, fileArray) => {
    let objects = await readDir(currentDir)

    for (let i = 0; i < objects.length; i++) {
        objects[i] = path.join(currentDir, objects[i])
        let stat = fs.lstatSync(objects[i])

        try {
            if (stat.isFile()) {
                fileArray.push(objects[i])
            }
            else if (stat.isDirectory()) {
                let subObjects = await this.listFilenamesRecursive(objects[i], fileArray)
                fileArray.concat(subObjects)
            }
            else {
                throw new Error(`${f} is neither file nor directory`)
            }
        }
        catch (err) {
            console.log(err)
        }
    }

    return fileArray;
}

exports.buildFileStatus = async (dataPath) => {
    let files = []
    let fileHashes = {}

    files = await this.listFilenamesRecursive(dataPath, files)

    for (let i = 0; i < files.length; i++)
    {
        fileHashes[files[i]] = await hash.getHash(files[i])
    }
    
    return fileHashes
}

exports.getFile = async (dataPath) => {
    let blob = await readFile(dataPath, {encoding: 'binary'})
    return blob
}
