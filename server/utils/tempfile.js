'use strict';

var os = require('os');
var path = require('path');
var crypto = require('crypto');

var createTmpFileName = function () {
    return path.join(
        os.tmpdir(),
        'writer_' + crypto.randomBytes(32).toString('hex')
    );
};

module.exports = createTmpFileName;
