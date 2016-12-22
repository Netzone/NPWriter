const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser');
const ConfigRoutes = require('./config')
const NewsItemRoutes = require('./newsitem')
let SpellCheckRoutes = null
try {
  SpellCheckRoutes = require('./spellcheck')
} catch (err) {
  // nodehun does not work under Windows :/
}
const ConceptItemRoutes = require('./conceptitem')
const ErrorRoutes = require('./error')
const HealthCheckRoutes = require('./healthcheck')
const ProxyRoutes = require('./proxy')

var log = require('../utils/logger').child({api: 'Router'});

/**
 * Middleware to do some logging
 */
router.use(function timeLog(req, res, next) {
    log.debug({method: req.method, url: req.url});
    next();
});

router.use(bodyParser.json({limit: '50Mb', extended: true, type: "application/json"}));
router.use(bodyParser.raw({limit: '50Mb', extended: true, type: "*/*"}));

router.route('/config').get(ConfigRoutes.getConfig);
router.route('/config').post(ConfigRoutes.setConfig);

router.use(NewsItemRoutes)
router.use(ConceptItemRoutes)
router.use(ErrorRoutes)
router.use(HealthCheckRoutes)
router.use(ProxyRoutes)
if (SpellCheckRoutes) {
  router.use(SpellCheckRoutes)
}

module.exports = router;