'use strict';

var fs = require('fs')
var path = require('path')
var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();

var SpellChecker = require('../models/SpellChecker');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

var dataDir = path.resolve(path.join(__dirname, '..', 'spellchecker'))
var spellchecker = new SpellChecker({
    dir: dataDir,
    defaultLang: 'en_US'
});

router.post('/spellcheck', function(req, res) {
    var text = req.body.text;
    var lang = req.body.lang;
    spellchecker.check(text, {lang: lang}, function(err, result) {
        if (err) {
            res.status(500).send('Internal Error')
        } else {
            res.status(200).json(result)
        }
    })
});

module.exports = router;
