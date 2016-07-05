const archiver = require('archiver');

const fs = require('fs');
const path = require('path');


const zip = function(dir, outDir='.') {
      const archive = archiver('zip');
      const file = path.parse(dir);
      const outFile = path.join(outDir, file.base + '.zip');
      const output = fs.createWriteStream(outFile);

      output.on('close', function() {
         console.log(`${archive.pointer()} bytes written to ${outFile}`);
      });

      archive.on('error', function(err){
         console.error(err);
      });

      archive.pipe(output);
      archive.directory(dir, file.base);
      archive.finalize();
      return outFile;
};

const deploy = function(conn) {
    return function(file) {
        console.log(`Packaging ${file}`);
        const archive = zip(file);
        console.log(`Deploying ${archive}`);
    }
};


module.exports = deploy;

