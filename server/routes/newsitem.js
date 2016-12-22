'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../models/ConfigurationManager');
var os = require('os');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var async = require('async');
var log = require('../utils/logger').child({api: 'Router'});
var createTmpFileName = require('../utils/tempfile');
var Backend = require('../models/Backend.js');
var BinaryProcessor = require('../models/BinaryProcessor.js');

router.post('/external/:name', function (req, res) {
    var backend;

    try {
        backend = config.getBackend(req.params.name, req.body.method, req.body.path);
    }
    catch (ex) {
        log.error({err: ex.message}, "Could not find a configured backend to handle the request");
        res.contentType('application/json')
            .status(ex.code)
            .send({error: ex.message});
        return;
    }

    Backend.call(
        backend,
        req.body,
        (error, response, body) => {
            if (error) {
                log.error({err: error, response: response, headers: req.headers});
                res.contentType('application/json')
                    .status(response.statusCode)
                    .send({error: error});
            }
            else {
                res.set(response.headers)
                    .status(response.statusCode)
                    .send(body);
            }

        }
    );
});

/**
 * Get a newsitem.
 * E.g. /api/newsitem/0f144a19-32a6-4151-9c74-c51751f161bd?imType=x-im/article
 */
router.get('/newsitem/:uuid', function (req, res) {
    var uuid = req.params.uuid,
        environment = config.get('environment'),
        imType = req.query.imType;

    if (imType === undefined) {
        Backend.defaultHandling(res, "Missing query parameter imType in request", "", "", null, req, uuid);
        return;
    }

    if ("demo" === uuid || "demo" === environment) {
        res.sendFile('newsitem-text.xml', {root: './data'});
        return;
    }
    else if ("demoimage" === uuid) {
        res.sendFile('newsitem-picture.xml', {root: './data'});
        return;
    }

    Backend.exec(
        '{"action":"get", "data": {"id":"' + uuid + '", "imType":"' + imType + '"}}',
        config.get('external.contentrepository'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, null, req, uuid);
        }
    );
});

/**
 * Save newsitem to backend.
 * E.g. /api/newsitem/0f144a19-32a6-4151-9c74-c51751f161bd
 */
router.put('/newsitem/:uuid', function (req, res) {
    var uuid = req.params.uuid,
        toBase64 = req.body.toString('base64');

    log.info({id: uuid}, "Updating newsitem");

    Backend.exec(
        '{"action":"update", "data": {"id":"' + uuid + '", "document": "' + toBase64 + '"}}',
        config.get('external.contentrepository'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, null, req, uuid);
        }
    );
});

/**
 * Create a new newsitem.
 * E.g. /api/newsitem
 */
router.post('/newsitem', function (req, res) {
    var toBase64 = req.body.toString('base64');

    log.info("Creating newsitem");

    Backend.exec(
        '{"action":"create", "data": {"document": "' + toBase64 + '"}}',
        config.get('external.contentrepository'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, null, req, "New item")
        }
    );
});

/**
 * @deprecated use '/binary' instead.
 *
 * Upload image and retrieve NewsML document with meta data
 */
router.post('/image', function (req, res) {

    log.info({clientFilename: req.headers['x-filename']}, "Downloading content to local file");

    var buffer = new Buffer(req.body),
        tmpfileName = path.join(
            os.tmpdir(),
            'writer_' + crypto.randomBytes(32).toString('hex')
        );

    log.debug({
        file: req.headers['x-filename'],
        length: buffer.byteLength,
        contentType: req.headers['content-type']
    }, 'Image uploaded');

    var fd = fs.openSync(tmpfileName, 'w');
    if (!fd) {
        log.error({filename: tmpfileName});
        Backend.defaultHandling(res, 'Failed opening temporary file', null, null, null, req,
            "download local file");
        return;
    }

    fs.write(fd, buffer, 0, buffer.byteLength, function (err, written, buffer) {
        fs.closeSync(fd);
        buffer = null;

        if (err) {
            log.error({filename: tmpfileName}, 'Failed writing to tmp file');
            fs.unlink(tmpfileName);
            Backend.defaultHandling(res, 'Failed writing to temporary file', null, null, null, req,
                "writing to local file");
            return;
        }

        log.info({clientFilename: req.headers['x-filename']}, "download done");

        var formData = {
            image: {
                value: fs.createReadStream(tmpfileName),
                options: {
                    filename: req.headers['x-filename'],
                    contentType: req.headers['content-type']
                }
            }
        };

        log.info({clientFilename: req.headers['x-filename']}, "Uploading content to backend");

        Backend.upload(
            formData,
            config.get('external.contentrepository'),
            (error, response, body) => {
                fs.unlink(tmpfileName);
                Backend.defaultHandling(res, error, response, body, null, req,
                    req.headers['x-filename']);
            }
        );

    });
});

/**
 * Upload binary and retrieve NewsItem document with meta data
 *
 * Expects header x-infomaker-type to be set, e.g. 'x-im/image'.
 */
router.post('/binary', function (req, res) {
    log.info('Binary post request: ', req);

    var objectName, imType, maxSize, buffer, tmpFileName, fd;

    objectName = decodeURIComponent(req.headers['x-filename']);
    log.info({clientFilename: objectName}, "Downloading content to local file");

    //Sanity check
    if (typeof req.headers['x-infomaker-type'] == "undefined") {
        log.error('Invalid request to POST /binary. Missing request header x-infomaker-type');
        Backend.defaultErrorHandling(
            res, 'Error uploading binary. Invalid request', 400, null, req.headers, objectName
        );
        return;
    }

    imType = req.headers['x-infomaker-type'];
    maxSize = BinaryProcessor.getMaxUploadByteSize(imType);
    buffer = new Buffer(req.body);

    if (buffer.byteLength > maxSize) {
        log.error('Binary to large. Maximum size is', maxSize, 'bytes');
        Backend.defaultErrorHandling(
            res, 'Error uploading binary. Max binary size exceeded. Max size is ' +
            maxSize + ' bytes.', 413, null, req.headers, objectName
        );
        return;
    }

    tmpFileName = createTmpFileName();
    log.debug({
        file: objectName,
        length: buffer.byteLength,
        contentType: req.headers['content-type']
    }, 'Image uploaded');

    fd = fs.openSync(tmpFileName, 'w');
    if (!fd) {
        log.error('Failed to open tmp file', tmpFileName);
        Backend.defaultErrorHandling(
            res, 'Error uploading binary. Failed to open tmp file', 500, null, req.headers, objectName
        );
        return;
    }

    fs.write(fd, buffer, 0, buffer.byteLength, function (error, written, buffer) {
        fs.closeSync(fd);
        buffer = null;
        if (error) {
            log.error('Failed writing to tmp file', tmpFileName, 'Error was', error);
            fs.unlink(tmpFileName);
            Backend.defaultErrorHandling(
                res, 'Error uploading binary. Failed writing to tmp file', 500, null, req.headers, objectName
            );
            return;
        }

        log.debug({clientFilename: objectName}, "download done");
        BinaryProcessor.uploadBinary(tmpFileName, imType, objectName,
            function (error, binaryInfo, newsItem) {
                fs.unlink(tmpFileName);
                if (error) {
                    log.error('Error uploading binary.', error);
                    Backend.defaultErrorHandling(res, 'Error uploading binary.', 500, null, req.headers, objectName);
                } else {
                    // Optimistic view of life
                    var response = {statusCode: 200};
                    if (newsItem) {
                        // Binary already associated with newsItem, use it
                        log.debug('Found existing newsItem for binary with object name', objectName);
                        Backend.defaultHandling(res, null, response, newsItem, null, req, objectName);
                    } else {
                        // First time binary gets uploaded, create newsItem for it
                        log.debug('Got hashed binary name:', binaryInfo.hashedName);
                        Backend.exec(
                            '{"action":"create_binary_newsitem", "data": {"filename":"' + binaryInfo.hashedName +
                            '", "imType":"' + imType + '", "mimetype":"' + binaryInfo.mimetype +
                            '", "objectName":"' + objectName + '"}}', config.get('external.contentrepository'),
                            (error, response, newsItem) => {
                                if (error) {
                                    log.error('Error creating newsItem.', error);
                                    Backend.defaultErrorHandling(
                                        res, 'Error uploading binary', 500, response, req.headers, objectName
                                    );
                                } else {
                                    log.debug('Done uploading binary and creating newsItem');
                                    Backend.defaultHandling(
                                        res, null, response, newsItem, null, req, objectName
                                    );
                                }
                            });
                    }
                }
            });
    });
});

/**
 * @deprecated: Use router.get('binary'...) instead.
 *
 * Upload image using url drop.
 */
router.get('/image', function (req, res) {
    var source = req.query.source;

    log.info({url: source}, "Uploading content from URL");

    Backend.uploadUrl(source, config.get('external.contentrepository'), (error, response, body) => {
        Backend.defaultHandling(res, error, response, body, null, req, source);
    });
});

/**
 * Upload binary using url drop.
 */
router.get('/binary', function (req, res) {
    var context, msg, source, imType, tmpFileName;

    // Sanity check
    if (typeof req.query.imType == "undefined") {
        msg = 'Invalid request to GET /binary. Missing query parameter imType';
    }

    if (typeof req.query.source == "undefined") {
        msg = 'Invalid request to GET /binary. Missing query parameter source';
    }

    context = 'download binary from url';
    if (msg) {
        Backend.defaultErrorHandling(res, msg, null, null, req.headers, context);
        return;
    }

    source = req.query.source;
    imType = req.query.imType;
    tmpFileName = createTmpFileName();

    async.waterfall([
        function download(next) {
            BinaryProcessor.downloadByUrl(source, tmpFileName, imType, function (error) {
                if (error) {
                    return next(error.error, error.statusCode);
                } else {
                    next(null);
                }
            });
        },
        function uploadBinary(next) {
            BinaryProcessor.uploadBinary(tmpFileName, imType, 'stream-binary', function (error, binaryInfo, newsItem) {
                if (error) {
                    next(error);
                } else {
                    if (newsItem) {
                        // Binary already associated with newsItem, use it.
                        next(null, null, newsItem);
                    } else {
                        // First time binary gets uploaded, create newsItem for it.
                        Backend.exec(
                            '{"action":"create_binary_newsitem", "data": {"filename":"' + binaryInfo.hashedName +
                            '", "imType":"' + imType + '", "mimetype":"' + binaryInfo.mimetype +
                            '", "objectName":""}}', config.get('external.contentrepository'),
                            (error, response, newsItem) => {
                                if (error) {
                                    return next(error, response.statusCode);
                                }
                                next(null, response.statusCode, newsItem);
                            });
                    }
                }
            })
        }
    ], function (error, statusCode, newsItem) {
        fs.unlink(tmpFileName);
        if (error) {
            Backend.defaultErrorHandling(res, error, statusCode, null, req.headers, context);
        } else {
            var response = {statusCode: 200};
            Backend.defaultHandling(res, error, response, newsItem, null, req, context);
        }
    });
});

/**
 * Get image newsitem
 */
router.get('/image/newsitem/:uuid', function (req, res) {
    var data = JSON.stringify({
        action: 'get',
        data: {
            id: req.params.uuid,
            itemClass: 'ninat:picture',
            imType: req.query.imType
        }
    });

    Backend.exec(
        data,
        config.get('external.contentrepository'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, null, req);
        }
    );
});

/**
 * @deprecated use /binary/url... instead. This endpoint will always
 * resolve imType query parameter to "x-im/type".
 *
 * Get url to imgix image
 */
router.get('/image/url/:uuid/:height?', function (req, res) {
    log.warn('get /image/url/:uuid/:height? endpoint is deprecated!');

    var redirectUrl, height, width

    // Redirect to new "renderUrl" endpoint
    redirectUrl = '/api/binary/url/' + req.params.uuid;
    if (!isNaN(parseInt(req.params.height))) {
        height = req.params.height;
    }

    if (!isNaN(parseInt(req.query.width))) {
        width = req.params.width;
    }

    if (height) {
        redirectUrl = redirectUrl + '/' + height;
    }

    redirectUrl = redirectUrl + '?imType=x-im/image';
    if (width) {
        redirectUrl = redirectUrl + '&width=' + width;
    }

    log.debug('Redirect URL:', redirectUrl);
    res.redirect(redirectUrl);
});

/**
 * Get render url for binary
 */
router.get('/binary/url/:uuid/:height?', function (req, res) {
    var params, data;

    // Sanity check
    params = req.query;
    if (typeof params.imType == "undefined") {
        Backend.defaultErrorHandling(
            res,
            'Invalid request to GET /binary/url. Missing query parameter imType',
            400,
            null,
            req.headers,
            req.params.uuid
        );
        return;
    }

    params.id = req.params.uuid;
    params.w = "800";

    if (!isNaN(parseInt(req.params.height))) {
        params.h = req.params.height.toString();
    }

    if (!isNaN(parseInt(req.query.width))) {
        params.w = req.query.width.toString();
    }

    data = JSON.stringify(params);
    log.info({id: req.params.uuid}, "Getting binary url");

    Backend.exec(
        '{"action": "render_binary", "data": {"id": "' + req.params.uuid + '", "imType": "' +
        req.query.imType + '", "params": ' + JSON.stringify(params) + '}}',
        config.get('external.contentrepository'),
        (error, response, body) => {
            log.info({body: body}, "Got url");
            Backend.defaultHandling(res, error, response, body, null, req, req.params.uuid);
        }
    );
});

module.exports = router;
