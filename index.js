const archiver = require('archiver');

const fs = require('fs');
const path = require('path');

const jsforceConnection = require('jsforce-connection');

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

const info = function(message) {
    console.log(`       ${message}`);
};

const error = function(message) {
    console.error(` !     ${message}`);
};

const deploy = function(conn) {
    return function(file) {
        console.log(`Packaging ${file}`);
        const zipPath = zip(file);
        console.log(`Deploying ${zipPath}`);

        return jsforceConnection()
            .then( conn => {
                return new Promise((resolve, reject) => {
                    console.log('-----> Deploying metadata');
                    const zipStream = fs.createReadStream(zipPath);
                    conn.metadata.pollTimeout = 240*1000;
                    const deployLocator = conn.metadata.deploy(zipStream, {});
                    deployLocator.complete(true, function(err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(result);
                    });
                })
            })
            .then( result => {
                info('done ? :' + result.done);
                info('success ? : ' + result.true);
                info('state : ' + result.state);
                info('component errors: ' + result.numberComponentErrors);
                info('components deployed: ' + result.numberComponentsDeployed);
                info('tests completed: ' + result.numberTestsCompleted);
                info('       ' + (result.success ? 'Success' : 'Failed'));
            })
            .catch( err => {
                error(err.stack);
                process.exit(1);
            });
    }
};


module.exports = deploy;

