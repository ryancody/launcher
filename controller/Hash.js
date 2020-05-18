const crypto = require('crypto')
const fs = require('fs')

exports.getHash = (path) => {
    return new Promise((resolve, reject) => {
        var stream = fs.createReadStream(path)
        var hash = crypto.createHash('sha1')
        
        hash.setEncoding('hex')
    
        stream.pipe(hash)
    
        stream.on('end', () => {
            hash.end()
            resolve(hash.read())
        })
    })
}