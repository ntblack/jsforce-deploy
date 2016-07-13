const archiver = require('archiver');

const fs = require('fs');
const path = require('path');


const zip = function(dir, outDir='.') {
      const archive = archiver('zip');
      const file = path.parse(dir);
      const outFile = path.join(outDir, file.base + '.zip');
      const output = fs.createWriteStream(outFile);

      return new Promise((resolve, reject) => {
          output.on('close', function() {
              console.log(`${archive.pointer()} bytes written to ${outFile}`);
              resolve(outFile);
          });
          archive.on('error', function(err){
              console.error(err);
              reject(err);
          });

          archive.pipe(output);
          archive.directory(dir, file.base);
          archive.finalize();
      });
};

const _info = function(message) {
    console.log(`       ${message}`);
};

const _warning = function(message) {
    console.log(`-----> ${message}`);
}

const _error = function(message) {
    console.error(` !     ${message}`);
};

const deploy = function(conn, info=_info, warning=_warning, error=_error) {
    return function(file) {
        info(`Packaging ${file}`);

        return zip(file).then((zipPath) => {
            return new Promise((resolve, reject) => {
                info(`Deploying ${zipPath}`);
                warning('Deploying metadata');
                const zipStream = fs.createReadStream(zipPath);
                conn.metadata.pollTimeout = 240 * 1000;
                const deployLocator = conn.metadata.deploy(zipStream, {});
                deployLocator.complete(true, function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            })
                .then(result => {
                    info('done ? :' + result.done);
                    info('success ? : ' + result.true);
                    info('state : ' + result.state);
                    info('component errors: ' + result.numberComponentErrors);
                    info('components deployed: ' + result.numberComponentsDeployed);
                    info('tests completed: ' + result.numberTestsCompleted);

                    if(result.details.componentFailures) {
                        error(JSON.stringify(result.details.componentFailures));
                        info('Deployment failed');
                        process.exit(1);
                    } else {
                        info('Deployment succeeded');
                    }

                })
                .catch(err => {
                    error(err.stack);
                    process.exit(1);
                });
        });
    }
};

module.exports = deploy;

