#! /usr/bin/env node

const deploy = require('../index')();

deploy(process.argv[2], process.argv[3]);
