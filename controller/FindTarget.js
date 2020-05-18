const path = require('path')
let dirPath = path.require.main;

console.log(dirPath)

exports.getFilesInTarget = () =>
{
    console.log(dirPath);
}

