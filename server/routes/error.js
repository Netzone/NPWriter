'use strict';

var express = require('express');
var router = express.Router();
var log = require('../utils/logger').child({api: 'Router'});

/**
 * Error logging from browsers.
 * E.g. GET /api/err?error=Something error happens
 */
router.get('/err', function (req, res) {
    log.error("Browser error", {error: req.query.error, headers: req.headers});
    res.status(204).send();
});

module.exports = router;
