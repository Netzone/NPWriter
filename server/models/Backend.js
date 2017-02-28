'use strict';

var request = require('request');
var config = require('../models/ConfigurationManager');
var log = require('../utils/logger').child({model: 'Backend'});
var b64 = require('b64');
var fs = require('fs');
let ocSanitize = require('../utils/oc-search-sanitizer');

function Backend() {
}

Backend.execWithHeaders = function (body, cfg, headers, cb, operation) {
    let port = "";

    if (cfg.port !== undefined && cfg.port !== undefined) {
        port = ":" + cfg.port;
    }

    const uri = cfg.protocol + "//" + cfg.host + port + "/" + cfg.endpoint;
    const truncatedBody = body.length < 100 ? body : body.substring(0, 100) + '... (body is truncated)'

    log.debug({url: uri, body: truncatedBody}, 'Execute backend request');

    if (!headers) {
        headers = {}
    }

    headers['Content-Type'] = 'application/json'

    if (operation && operation.requestId) {
        headers['X-Request-Id'] = operation.requestId;
    }

    request({
        method: 'POST',
        uri: uri,
        headers: headers,
        body: body
    }, (error, response, body) => {
        cb(error, response, body);
    });
};

Backend.exec = function (body, cfg, cb, operation) {
    Backend.execWithHeaders(body, cfg, null, cb, operation)
};


/**
 * Make a call to an external backend
 *
 * @param {object} backend Backend speification object
 * @param {object} op Call operation configuration object
 * @param {Function} cb Callback function for handling response
 */
Backend.call = function (backend, op, cb) {
    var uri = backend.protocol + "://" + backend.host + ":" + backend.port,
        requestObj = {
            method: op.method,
            uri: uri,
            headers: {
                'Content-Type': op.contentType
            }
        };

    if (op.headers) {
        for (var header in op.headers) {
            requestObj.headers[header] = op.headers[header];
        }
    }

    if (op.path) {
        requestObj.uri += op.path;
    }

    var parameters = 0;
    if (op.query) {
        for (var param in op.query) {
            requestObj.uri += (parameters++) ? '&' : '?';
            requestObj.uri += param + '=' + encodeURIComponent(op.query[param]);
        }
    }

    if (op.body) {
        requestObj.body = b64.decode(new Buffer(op.body, 'utf8')).toString();
    }

    log.debug({url: requestObj.uri, body: requestObj.body}, 'Proxy backend request');

    request(requestObj, (error, response, body) => {
        cb(error, response, body);
    });
};

/**
 * Search for an entity in concepts backend
 * @param {string} entity Type of entity
 * @param {string} query
 * @param {*} res
 * @param req
 */
Backend.search = function (entity, query, res, req) {
    var sanitizedQuery = ocSanitize(query);
    if (sanitizedQuery.length === 0) {
        res.contentType('application/json').status(200).send([]);
        return;
    }

    if (sanitizedQuery.charAt(sanitizedQuery.length - 1) !== '*') {
        sanitizedQuery += "*";
    }

    Backend.exec('{"action":"search", "data": {"entity": "' + entity + '", "query":"' + sanitizedQuery + '"}}',
        config.get('external.conceptbackend'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, 'application/json', req, undefined);
        });
};

Backend.upload = function (formData, cfg, cb) {
    log.warn("[DEPRECATED] Using upload instead of requesting upload url")
    request.post({
        url: cfg.protocol + "//" + cfg.host + ":" + cfg.port + "/" + cfg.upload,
        formData: formData
    }, (err, response, body) => {
        log.debug({response: response, body: body}, 'Server response after upload');
        cb(err, response, body);
    });
};

/**
 * Upload data using an url.
 *
 * @param file          File to upload.
 * @param contentType   Content type (mimetype) of file.
 * @param uploadUrl     URL used for upload/POST request.
 * @param cb            Callback.
 */
Backend.uploadByUrl = function (file, contentType, uploadUrl, cb) {
    fs.stat(file, function (error, stat) {
        if (error) {
            cb(error);
        } else {
            var options = {
                method: 'PUT',
                url: uploadUrl,
                body: fs.createReadStream(file),
                headers: {
                    "Content-Type": contentType,
                    "Content-Length": stat.size
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    cb(error);
                } else {
                    cb(null, response, body);
                }
            });
        }
    });
};

Backend.uploadUrl = function (url, cfg, cb) {
    request.get({
        url: cfg.protocol + "//" + cfg.host + ":" + cfg.port + "/" + cfg.upload + "?source=" + encodeURIComponent(url),
    }, (err, response, body) => {
        log.debug({response: response, body: body}, 'Server response after url upload');
        cb(err, response, body);
    });
};

Backend.defaultHandling = function (res, error, response, body, contentType, req, context) {
    if (error) {
        log.error({err: error, response: response, headers: req.headers, context: context});
        res.contentType('application/json')
            .status(404)
            .send({error: error});
    } else {

        if (response.headers && response.headers.etag) {
            res.setHeader('ETag', response.headers.etag)
            if (context) {
                context['ETag'] = response.headers.etag
            }
        }

        if (response.headers && response.headers.location) {
            res.setHeader('Location', response.headers.location)
            if (context) {
                context['Location'] = response.headers.location
            }
        }

        if (context) {
            context['statusCode'] = response.statusCode
            log.info({context: context}, "operation finished");
        }

        res.contentType(contentType || 'application/xml')
            .status(response.statusCode)
            .send(body);
    }
};

/**
 * Default error handling for Writer backend.
 *
 * @param responseOut       Response sent back to client.
 * @param error             The actual error message.
 * @param statusCode        Http status code. If not supplied defaults to 500.
 * @param responseIn        Response from any external requests made by server.
 * @param requestHeaders    Client request headers.
 * @param context           Context used to group log entries.
 */
Backend.defaultErrorHandling = function (responseOut, error, statusCode, responseIn, requestHeaders, context) {
    log.error({err: error, response: responseIn, headers: requestHeaders, statusCode: statusCode, context: context});
    statusCode = statusCode || 500;
    responseOut.contentType('application/json').status(statusCode).send({error: error});
};


module.exports = Backend;
