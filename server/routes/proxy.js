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
        requestDebug(request)
    }

    // Check which method that is used
    const method = req.method.toUpperCase()

    switch (method) {

        case 'POST':
            post(req.query.url, req, res)
            break

        case 'GET':
            get(req.query.url, req, res)
            break

        case 'PUT':
            put(req.query.url, req, res)
            break

        case 'DELETE':
            del(req.query.url, req, res)
            break

        default:
            res.status(404).contentType('application/json').send({error: 'Method not allowed ' + method})
    }

});

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
                log.error({method: 'GET', status: response.statusCode, url: url}, "Failed fetching resource through proxy");
            }
        })
        .on('error', (error) => {
            log.error({method: 'GET', error: error, url: url}, "Error while fetching resource through proxy");
        })).pipe(res)
}


/**
 * Make a DELETE request to specified URL
 * @param url
 * @param req
 * @param res
 */
function del(url, req, res) {
    let options = {
        body: req.body
    }
    req.pipe(request.delete(url, options, (error, httpStatusCode, body) => {
        if (error) {
            log.error({
                method: 'DELETE',
                status: httpStatusCode,
                url: req.query.url
            }, "Failed fetching resource through proxy");
        }
    }), {end: false}).pipe(res)
}


/**
 * Make a POST request to specified URL
 * @param url
 * @param req
 * @param res
 */
function post(url, req, res) {

    let options = {
        body: req.body
    }
    req.pipe(request.post(url, options, (error, httpStatusCode, body) => {
        if (error) {
            log.error({
                method: 'POST',
                status: httpStatusCode,
                url: req.query.url
            }, "Failed fetching resource through proxy");
        }
    }), {end: false}).pipe(res)
}

/**
 * Make a PUT request to specified URL
 * @param url
 * @param req
 * @param res
 */
function put(url, req, res) {

    let options = {
        body: req.body
    }
    req.pipe(request.put(url, options, (error, httpStatusCode, body) => {
        if (error) {
            log.error({
                method: 'PUT',
                status: httpStatusCode,
                url: req.query.url
            }, "Failed fetching resource through proxy");
        }
    }), {end: false}).pipe(res)
}

module.exports = router;
