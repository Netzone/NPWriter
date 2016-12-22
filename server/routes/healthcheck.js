'use strict';

var express = require('express');
var router = express.Router();
var config = require('../models/ConfigurationManager');
var Backend = require('../models/Backend.js');
var log = require('../utils/logger').child({api: 'Router'});

/**
 * Check health of backend only (?mode=dependencies) or full stack (?mode=fullstack).
 * E.g. HEAD /api/healthcheck?mode=fullstack
 */
router.head('/healthcheck', function (req, res) {
    var rp = require('request-promise');
    var editorCfg = config.get('external.contentrepository');

    if (req.query.mode && req.query.mode === 'dependencies') {
        var editorHealthUrl = editorCfg.protocol + "//" + editorCfg.host + ":" + editorCfg.port + "/cxf/writer/healthcheck";

        rp({url: editorHealthUrl, method: 'HEAD', resolveWithFullResponse: true})
            .then(function (response) {
                if (response.statusCode && response.statusCode === 200) {
                    res.status(200).send();
                } else {
                    log.error({
                        error: {
                            statusCode: response.statusCode,
                            body: response.body
                        }
                    }, "Health check failed for editorservice")
                    res.status(502).send();
                }
            })
            .catch(function (e) {
                log.error({message: e.message}, "Healthcheck failed for editorservice");
                res.status(502).send();
            });
    } else if (req.query.mode && req.query.mode === 'fullstack') {
        var templateId = config.get('newsItemTemplateId');

        Backend.exec(
            '{"action":"get", "data": {"id":"' + templateId + '", "imType":"x-im/image"}}',
            config.get('external.contentrepository'),
            (error, response, body) => {
                if (error) {
                    log.error({error: error, response: response, uuid: templateId},
                        "Fetching template failed for editorservice during healthcheck");
                    res.status(502).send();
                } else if (response.statusCode !== 200) {
                    log.error({
                        error: error,
                        response: response.statusCode,
                        uuid: templateId
                    }, "Error fetching template from editorservice during healthcheck");
                    res.status(502).send();
                }
                res.status(200).send();
            });
    } else {
        res.status(200).send();
    }
});

module.exports = router;