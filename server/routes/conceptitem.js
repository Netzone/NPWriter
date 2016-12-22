'use strict';

var express = require('express');
var router = express.Router();
var config = require('../models/ConfigurationManager');
var log = require('../utils/logger').child({api: 'Router'});
var Backend = require('../models/Backend.js');

/**
 * Search authors route.
 * E.g. GET /api/search/concepts/authors?q=Jer
 */
router.get('/search/concepts/authors', function (req, res) {
    Backend.search('authors', req.query.q, res, req);
});

/**
 * Search tags.
 * E.g. GET /api/search/concepts/tags?q=Sp
 */
router.get('/search/concepts/tags', function (req, res) {
    Backend.search('tags', req.query.q, res, req);
});

/**
 * Search for places in Concepts backend.
 */
router.get('/search/concepts/locations', function (req, res) {
    var query = req.query.q,
        filter = req.query.f,
        entity = 'locations';

    if (filter == 'position') {
        entity = 'position_locations';
    }
    else if (filter == 'polygon') {
        entity = 'polygon_locations';
    }

    Backend.exec(
        '{"action":"search", "data": {"entity": "' + entity + '", "query":"' + query + '"}}',
        config.get('external.conceptbackend'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, null, req, "concept search");
        }
    );
});

/**
 * Search for channels in Concepts backend
 */
router.get('/search/concepts/channels', function (req, res) {
    Backend.search('channels', req.query.q, res, req);
});

/**
 * Search for articles in Concpets backend
 */
router.get('/search/concepts/articles', function (req, res) {
    Backend.search('articles', req.query.q, res, req);
});

/**
 * Search for stories in Concepts backend
 */
router.get('/search/concepts/stories', function (req, res) {
    Backend.search('stories', req.query.q, res, req);
});

/**
 * Search for content profiles/function-tags in Concepts backend
 */
router.get('/search/concepts/contentprofiles', function (req, res) {
    Backend.search('contentprofiles', req.query.q, res, req);
});

/**
 * Search for content categories in Concepts backend
 */
router.get('/search/concepts/categories', function (req, res) {
    Backend.search('categories', req.query.q, res, req);
});

/**
 * @param {string} twitterHandle - The username on twitter
 */
router.get('/concepts/author/:twitterHandle/thumbnail', function (req, res) {
    var twitterHandle = req.params.twitterHandle;
    log.info({twitterHandle: twitterHandle}, "Getting twitter handle");

    Backend.exec(
        '{"action":"thumbnail", "data": {"url":"https://twitter.com/' + twitterHandle + '"}}',
        config.get('external.conceptbackend'),
        (error, response, body) => {
            Backend.defaultHandling(res, error, response, body, 'text/html', req, twitterHandle);
        }
    );
});

module.exports = router;
