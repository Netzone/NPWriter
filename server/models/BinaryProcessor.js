'use strict';

var fs = require('fs');
var crypto = require('crypto');
var base64url = require('base64-url');
var async = require('async');
var readChunk = require('read-chunk');
var fileType = require('file-type');
var request = require('request');

var log = require('../utils/logger').child({api: 'BinaryProcessor'});
var config = require('../models/ConfigurationManager');
var Backend = require('../models/Backend.js');

function BinaryProcessor() { }

/**
 * Returns max size in bytes for upload.
 *
 * @param imType        Type of binary to get max size for. Not implemented (yet)!
 * @returns {number}    Max size in bytes.
 */
BinaryProcessor.getMaxUploadByteSize = function (imType) {
    // TODO if necessary to have max size per type, use imType
    return 40 * 1024 * 1000;
};

/**
 * Uploads binary to backend. This involves creating a hashed file name used for
 * the binary and mimetype. A check is made towards backend to verify that newsItem
 * does not already exists for binary, if so this is returned. If not, an upload
 * URL is requested from the backend and used to upload the binary.
 *
 * @param file          The binary to upload.
 * @param imType        The type of binary to upload, e.g. 'x-im/image'.
 * @param objectName    The original file name for the binary (if any).
 * @param callback      Callback.
 */
BinaryProcessor.uploadBinary = function (file, imType, objectName, callback) {
    async.waterfall([
        function extractInfo(next) {
            BinaryProcessor.extractInfo(file, (error, binaryInfo) => {
                if (error) {
                    log.error('Error extracting info from binary.', error);
                    return next('Error extracting info from binary');
                }
                next(null, binaryInfo);
            });
        },
        function getNewsItem(binaryInfo, next) {
            BinaryProcessor._getNewsItemByFileName(binaryInfo.hashedName, imType, (error, newsItem, response) => {
                if (error) {
                    log.error('Error getting newsItem.', error, response);
                    return next('Error getting newsItem for binary');
                } else if (newsItem) {
                    log.debug('Found existing newsItem for binary', binaryInfo.hashedName);
                    next(null, null, newsItem);
                } else {
                    next(null, binaryInfo, null);
                }
            });
        },
        function getUploadUrl(binaryInfo, newsItem, next) {
            if (newsItem) {
                // Already found newsItem, skip this function call
                next(null, null, null, newsItem);
            } else {
                BinaryProcessor._getUploadUrl(binaryInfo.hashedName, imType, binaryInfo.mimetype,
                    (error, uploadUrl, response) => {
                        if (error) {
                            log.error('Error getting upload url.', error, response);
                            return next('Error getting upload url for binary');
                        }
                        next(null, binaryInfo, uploadUrl, null);
                    });
            }
        },
        function uploadFile(binaryInfo, uploadUrl, newsItem, next) {
            if (newsItem) {
                // Already found newsItem, skip this function call
                next(null, null, newsItem);
            } else {
                BinaryProcessor._uploadByUrl(uploadUrl, file, binaryInfo.mimetype, binaryInfo.hashedName,
                    objectName, imType, (error) => {
                        if (error) {
                            log.error('Error uploading binary.', error, ' using upload url', uploadUrl);
                            return next('Error uploading binary');
                        }
                        next(null, binaryInfo, null);
                    });
            }
        }
    ], function (error, binaryInfo, newsItem) {
        if (error) {
            callback(error);
        } else {
            callback(null, binaryInfo, newsItem);
        }
    });
};

/**
 * Download binary from external URL to temporary file on server. Max size is
 * checked before temporary file is created.
 *
 * @param url       External URL to download binary from.
 * @param file      Temporary file to pipe binary bytes to.
 * @param imType    Type of binary, e.g. 'x-im/image'.
 * @param callback  Callback.
 */
BinaryProcessor.downloadByUrl = function (url, file, imType, callback) {
    var ws = fs.createWriteStream(file);
    var statusCode;

    ws.on('error', function (error) {
        log.error('Error downloading binary from url', url, 'Error was', error, 'Status code was', statusCode);
        if (statusCode && statusCode === 413) {
            callback({error: 'Error downloading binary from url. Binary too large.', statusCode: statusCode});
        } else {
            callback({error: 'Error downloading binary from url', statusCode: statusCode});
        }
    });

    ws.on('finish', function () {
        if (statusCode !== 200) {
            log.error('Error downloading binary from url', url, '. Status code was ' + statusCode);
            callback({error: 'Error downloading binary from url', statusCode: statusCode});
        } else {
            callback();
        }
    });

    var size = 0;
    var req = request.get(url);

    req.on('error', function (error) {
        log.error('Error downloading binary from', url, error);
    }).on('data', function (chunk) {
        size += chunk.length;

        if (size > BinaryProcessor.getMaxUploadByteSize(imType)) {
            statusCode = 413;
            ws.emit(
                'error',
                'Max binary size exceeded. Max size is ' + BinaryProcessor.getMaxUploadByteSize(imType) + ' bytes.'
            );
            req.abort();
        }
    }).on('response', function (response) {
        statusCode = response.statusCode;
    }).pipe(ws);
};

/**
 * Extracts mimetype, file extensions and creates hashed name from binary.
 *
 * @param file      The binary.
 * @param callback  Callback.
 */
BinaryProcessor.extractInfo = function (file, callback) {
    BinaryProcessor._hashBinaryName(file, function (err, hashedName) {
        if (err) {
            return callback(err);
        }

        // The file type is detected by checking the magic number of the buffer.
        var buffer = readChunk.sync(file, 0, 262);
        var fileTypeInfo = fileType(buffer);

        if (!fileTypeInfo) {
            return callback('Could not extract file type information from binary');
        }

        var fileName = fileTypeInfo.ext ? hashedName + '.' + fileTypeInfo.ext.toLowerCase() : hashedName;

        var binaryInfo = {
            hashedName: fileName,
            mimetype: fileTypeInfo.mime
        };

        log.debug('Binary info was:', binaryInfo);

        callback(null, binaryInfo);
    });
};


/**
 * Get newsItem for binary if any from backend.
 *
 * @param hashedFileName    The hashed file for the binary.
 * @param imType            The type of the binary. E.g. 'x-im/image'.
 * @param callback          Callback.
 * @private
 */
BinaryProcessor._getNewsItemByFileName = function (hashedFileName, imType, callback) {
    Backend.exec(
        '{"action":"get_binary_by_filename", "data": {"filename":"' + hashedFileName + '", "imType":"' + imType + '"}}',
        config.get('external.contentrepository'), (error, response, body) => {
            if (error) {
                callback('Error from backend', null, response);
            } else if (response.statusCode === 200) {
                // Found NewsItem match for file name
                callback(null, body, response);
            } else if (response.statusCode === 404) {
                // No NewsItem found
                callback(null, null, response);
            } else {
                callback('Error get NewsItem for file', null, response);
            }
        });
};

/**
 * Get an upload url from backend.
 *
 * @param hashedFileName    The hashed file for the binary.
 * @param imType            The type of the binary. E.g. 'x-im/image'.
 * @param mimeType          Binary mimetype.
 * @param callback          Callback.
 * @private
 */
BinaryProcessor._getUploadUrl = function (hashedFileName, imType, mimeType, callback) {
    Backend.exec(
        '{"action":"get_upload_url_for_binary", "data": {"filename":"' + hashedFileName +
        '", "imType":"' + imType + '", "mimeType":"' + mimeType + '"}}',
        config.get('external.contentrepository'), (error, response, body) => {
            if (error || response.statusCode !== 200) {
                callback('Error from backend', null, response);
            } else {
                callback(null, body, response);
            }
        });
};

/**
 * Uploads binary to an URL.
 *
 * @param url               The upload URL.
 * @param file              The binary to upload.
 * @param mimeType          The binary mimetype.
 * @param hashedFileName    The binary hashed name.
 * @param objectName        The original file name.
 * @param imType            The binary type, e.g. 'x-im/image'.
 * @param callback          Callback.
 * @private
 */
BinaryProcessor._uploadByUrl = function (url, file, mimeType, hashedFileName, objectName, imType, callback) {
    Backend.uploadByUrl(file, mimeType, url, (error, response, body) => {
        if (error) {
            callback(error);
        } else if (response.statusCode !== 200 && response.statusCode !== 201) {
            callback(response.statusCode);
        } else {
            callback(null, 'Successfully uploaded file');
        }
    });
};

/**
 * Hash binary name using sha1.
 *
 * @param file      The binary.
 * @param callback  Callback.
 * @private
 */
BinaryProcessor._hashBinaryName = function (file, callback) {
    try {
        var shasum = crypto.createHash('sha1');
        var stream = fs.ReadStream(file);

        stream.on('data', function (d) {
            shasum.update(d);
        });

        stream.on('end', function () {
            var hash = shasum.digest();
            var name = base64url.encode(hash);

            callback(null, name);
        });
    } catch (ex) {
        log.error(ex);
        callback('Error creating hash for binary');
    }
};

module.exports = BinaryProcessor;
