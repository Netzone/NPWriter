'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');
var requestDebug = require('request-debug');
var log = require('../utils/logger').child({api: 'Router'});
var config = require('../models/ConfigurationManager');


/**
 * Proxy for plugins
 * @TODO: Can we remove this?
 *
 * @deprecated
 */
router.get('/proxy', function (req, res) {
    var url = req.query.url;

    request({
        method: 'GET',
        uri: url,
        headers: {
            'Content-Type': 'application/json'
        }
    }, (error, response, body) => {
        log.debug({url: url, body: body}, 'Get url through proxy');
        if (error) {
            log.error({url: url, err: error}, 'Get url through proxy');
            res.contentType('application/json').status(404).send({error: error});
        } else {
            res.contentType('application/json').status(response.statusCode).send(body);
        }
    });
});

/**
 * Fetch remote resource through local proxy
 */
router.all('/resourceproxy', function (req, res) {

    if (config.get('debugProxyCalls') === true) {
        requestDebug(request, function (type, data) {
            log.error({proxyEvent: type, data: data})
        });
    }
    const url = req.query.url
    if (!url) {
        errorResponse(res, 422, 'Missing parameter url')
        return
    }

    // Check which method that is used
    const method = req.method.toUpperCase()

    try {
        switch (method) {
            case 'POST':
            case 'PUT':
            case 'DELETE':
                makeRequest(url, method.toLowerCase(), req, res)
                break
            case 'GET': {
                get(url, req, res)
                break;
            }
            default:
                log.info({method: method, url: url}, `Trying to make request with unknown method ${method}`);
                errorResponse(res, 400, `Unsupported method ${method}`)
        }

    } catch (e) {
        log.error({method: method, error: e, url: url}, `Error, METHOD: ${method} in resourceproxy`);
        errorResponse(res, 500, e.message)
    }

});

/**
 * Return a JSON response containing an message
 * @param res
 * @param {int} status  HTTP Status code
 * @param {string} message - The message to show for the user
 */
function errorResponse(res, status, message) {
    res.status(status).contentType('application/json').send({error: message})
}


/**
 * Generic method to make POST, PUT, DELETE requests to other
 * resources
 * @param {string} url - The url to fetch
 * @param {string} method - Which method to use
 * @param req
 * @param res
 */
function makeRequest(url, method, req, res) {
    req.pipe(request[method](url, (error, httpStatusCode, body) => {
        if (error) {
            log.error({
                error: error,
                method: method,
                status: httpStatusCode,
                url: req.query.url
            }, "Failed making resource request through proxy");

            throw new Error(error)
        }
    }), {end: false}).pipe(res)
}

/**
 * Making a GET request to specified URL
 * @param url
 * @param req
 * @param res
 */
function get(url, req, res) {
    req.pipe(request(url)
        .on('response', (response) => {
            if (response.statusCode !== 200) {
                log.error({
                    method: 'GET',
                    status: response.statusCode,
                    url: url
                }, "Failed fetching resource through proxy");
            }
        })
        .on('error', (error) => {
            log.error({method: 'GET', error: error, url: url}, "Error while fetching resource through proxy");
        })).pipe(res)
}





module.exports = router;
